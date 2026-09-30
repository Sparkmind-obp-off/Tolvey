import { readFileSync } from 'node:fs';
import { Miniflare, convertV4MiniflareOptions, Log, LogLevel } from 'miniflare';
import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { createCheckout, getOrder } from '../src/transaction-store';
import { newId } from '../src/config';
import app from '../src/index';
import type { Bindings } from '../src/types';
import {
  assertTransition,
  hash,
  parseCheckout,
  type TransactionState,
} from '../src/transaction-domain';

let runtime: Miniflare;
let db: D1Database;
let token: string;
const offerId = '33333333-3333-4333-8333-333333333333';
const input = () => ({
  offer_id: offerId,
  quantity: 2,
  source_channel: 'tolvey_direct',
});
const key = () => 'checkout-test-' + newId();

async function sqlFile(database: D1Database, file: string) {
  const sql = readFileSync(file, 'utf8');
  const parts = sql.includes('-- statement-breakpoint')
    ? sql.split('\n-- statement-breakpoint\n')
    : sql.replace(/^--.*$/gm, '').split(/;\s*(?:\n|$)/);
  await database.batch(
    parts
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => database.prepare(s)),
  );
}

beforeEach(async () => {
  token = newId() + newId(); // Ephemeral test-only credential, never persisted.
  runtime = new Miniflare(
    convertV4MiniflareOptions({
      name: 'transaction-checkpoint-tests',
      modules: true,
      script: readFileSync('dist/_worker.js', 'utf8'),
      compatibilityDate: '2026-04-15',
      d1Databases: ['DB'],
      bindings: {
        APP_ENV: 'test',
        TRANSACTION_CORE_ENABLED: 'true',
        TRANSACTION_CORE_TOKEN: token,
      },
      log: new Log(LogLevel.ERROR),
    }),
  );
  db = (await runtime.getD1Database('DB')) as unknown as D1Database;
  // Representative upgrade: an existing Phase 1 catalog is preserved.
  await sqlFile(db, 'migrations/0001_canonical_catalog.sql');
  await sqlFile(db, 'tests/fixtures/local-catalog.sql');
  await sqlFile(db, 'migrations/0002_transaction_core.sql');
  await sqlFile(db, 'migrations/0003_transaction_lifecycle.sql');
});
afterEach(async () => {
  await runtime?.dispose();
});

async function api(
  path: string,
  method = 'GET',
  data?: unknown,
  idempotencyKey = key(),
  auth = token,
) {
  return runtime.dispatchFetch(
    'http://test.local/api/transaction-core' + path,
    {
      method,
      headers: {
        Authorization: 'Bearer ' + auth,
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: data === undefined ? undefined : JSON.stringify(data),
    },
  );
}
async function counts() {
  return await db
    .prepare(
      `SELECT (SELECT count(*) FROM checkout_sessions) AS sessions,
    (SELECT count(*) FROM orders) AS orders, (SELECT count(*) FROM fulfillments) AS fulfillments,
    (SELECT count(*) FROM payments) AS payments, (SELECT count(*) FROM transaction_events WHERE is_duplicate = 0) AS events`,
    )
    .first();
}

describe('durable checkout and atomic pending order on real D1', () => {
  it('creates authoritative snapshots, blocked fulfillment, and no fabricated payment', async () => {
    const result = await createCheckout(db, input(), key(), newId());
    expect(result.replayed).toBe(false);
    expect(result.order).toMatchObject({
      amount_minor: 40000,
      unit_price_minor: 20000,
      currency: 'IDR',
      currency_exponent: 0,
      quantity: 2,
      state: 'CHECKOUT_STARTED',
      payment_status: 'PENDING',
      fulfillment_status: 'BLOCKED',
    });
    expect(result.order.transaction_reference).toMatch(/^TV-[0-9A-F]{32}$/);
    expect(
      new Date(result.checkout.expires_at).getTime() -
        new Date(result.checkout.created_at).getTime(),
    ).toBe(1800000);
    expect(await counts()).toEqual({
      sessions: 1,
      orders: 1,
      fulfillments: 1,
      payments: 0,
      events: 2,
    });
    expect(
      (await db.prepare('PRAGMA foreign_key_check').all()).results,
    ).toEqual([]);
  });

  it('replays same key without creating a second order/fulfillment/business event', async () => {
    const idem = key();
    const first = await createCheckout(db, input(), idem, newId());
    const retried = await createCheckout(db, input(), idem, newId());
    expect(retried.replayed).toBe(true);
    expect(retried.order).toEqual(first.order);
    expect(await counts()).toEqual({
      sessions: 1,
      orders: 1,
      fulfillments: 1,
      payments: 0,
      events: 2,
    });
    expect(
      await db
        .prepare(
          "SELECT is_duplicate, correlation_id FROM transaction_events WHERE kind = 'checkout.replayed'",
        )
        .first(),
    ).toEqual({ is_duplicate: 1, correlation_id: first.order.correlation_id });
    expect(JSON.stringify(first)).not.toContain(idem);
  });

  it.each(['quantity', 'source_channel', 'offer_id', 'customer_reference'])(
    'conflicting reused key rejects changed %s without mutation',
    async (field) => {
      const idem = key();
      await createCheckout(db, input(), idem, newId());
      const changes: Record<string, unknown> = {
        quantity: 3,
        source_channel: 'other_source',
        offer_id: newId(),
        customer_reference: newId(),
      };
      await expect(
        createCheckout(
          db,
          { ...input(), [field]: changes[field] },
          idem,
          newId(),
        ),
      ).rejects.toMatchObject({ code: 'IDEMPOTENCY_CONFLICT', status: 409 });
      expect(await counts()).toEqual({
        sessions: 1,
        orders: 1,
        fulfillments: 1,
        payments: 0,
        events: 2,
      });
    },
  );

  it('handles twelve concurrent identical requests with one durable winner', async () => {
    const idem = key();
    const results = await Promise.all(
      Array.from({ length: 12 }, () =>
        createCheckout(db, input(), idem, newId()),
      ),
    );
    expect(new Set(results.map((r) => r.order.id)).size).toBe(1);
    expect(results.filter((r) => !r.replayed)).toHaveLength(1);
    expect(await counts()).toEqual({
      sessions: 1,
      orders: 1,
      fulfillments: 1,
      payments: 0,
      events: 2,
    });
  });

  it('concurrent conflicting payloads cannot create two meanings for the same key', async () => {
    const idem = key();
    const results = await Promise.allSettled([
      createCheckout(db, input(), idem, newId()),
      createCheckout(db, { ...input(), quantity: 3 }, idem, newId()),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const rejected = results.find(
      (r) => r.status === 'rejected',
    ) as PromiseRejectedResult;
    expect(rejected.reason.code).toBe('IDEMPOTENCY_CONFLICT');
    expect(await counts()).toMatchObject({
      sessions: 1,
      orders: 1,
      fulfillments: 1,
    });
  });

  it('rolls back entire batch when a later event insert fails and safely retries', async () => {
    await db
      .prepare(
        "CREATE TRIGGER fail_test_event BEFORE INSERT ON transaction_events BEGIN SELECT RAISE(ABORT, 'test transient fault'); END;",
      )
      .run();
    const idem = key();
    await expect(createCheckout(db, input(), idem, newId())).rejects.toThrow();
    expect(await counts()).toEqual({
      sessions: 0,
      orders: 0,
      fulfillments: 0,
      payments: 0,
      events: 0,
    });
    await db.prepare('DROP TRIGGER fail_test_event').run();
    const result = await createCheckout(db, input(), idem, newId());
    expect(result.replayed).toBe(false);
    expect(await counts()).toMatchObject({
      sessions: 1,
      orders: 1,
      fulfillments: 1,
      events: 2,
    });
  });

  it('retry after lost response retrieves the committed result even if the offer is archived', async () => {
    const idem = key();
    const first = await createCheckout(db, input(), idem, newId());
    await db.prepare("UPDATE offers SET status = 'ARCHIVED'").run();
    expect((await createCheckout(db, input(), idem, newId())).order).toEqual(
      first.order,
    );
  });

  it.each(['products', 'product_versions', 'offers'])(
    'inactive %s prevents any checkout records',
    async (table) => {
      await db.prepare(`UPDATE ${table} SET status = 'ARCHIVED'`).run();
      await expect(
        createCheckout(db, input(), key(), newId()),
      ).rejects.toMatchObject({ code: 'OFFER_UNAVAILABLE' });
      expect(await counts()).toEqual({
        sessions: 0,
        orders: 0,
        fulfillments: 0,
        payments: 0,
        events: 0,
      });
    },
  );

  it('missing offer is rejected safely', async () => {
    await expect(
      createCheckout(db, { ...input(), offer_id: newId() }, key(), newId()),
    ).rejects.toMatchObject({ code: 'OFFER_UNAVAILABLE', status: 404 });
  });

  it('preserves money/name/delivery snapshots after canonical product/offer changes', async () => {
    const result = await createCheckout(db, input(), key(), newId());
    await db.batch([
      db.prepare(
        "UPDATE offers SET price_minor = 999, name = 'Changed', delivery_reference = 'other-config'",
      ),
      db.prepare("UPDATE products SET name = 'Changed product'"),
    ]);
    const order = await getOrder(db, result.order.id);
    expect(order).toMatchObject({
      amount_minor: 40000,
      offer_name: '[TEST] IDR verification offer',
      delivery_reference: 'test-only:no-delivery',
      product_name: '[TEST] Foundation Product',
    });
    await expect(
      db.prepare('UPDATE orders SET amount_minor = 0').run(),
    ).rejects.toThrow();
    await expect(
      db
        .prepare('UPDATE checkout_sessions SET expires_at = ?')
        .bind(new Date(Date.now() + 3600000).toISOString())
        .run(),
    ).rejects.toThrow();
    await expect(
      db
        .prepare(
          'UPDATE product_versions SET metadata_json = \'{"changed":true}\'',
        )
        .run(),
    ).rejects.toThrow();
    await expect(
      db.prepare("UPDATE product_versions SET version = 'changed'").run(),
    ).rejects.toThrow();
    await db.prepare("UPDATE product_versions SET status = 'ARCHIVED'").run();
    expect((await getOrder(db, result.order.id))?.version_label).toBe(
      'test-v1',
    );
  });

  it('safe-integer boundary is exact and multiplication overflow creates no records', async () => {
    await db
      .prepare('UPDATE offers SET price_minor = ?')
      .bind(Number.MAX_SAFE_INTEGER)
      .run();
    await expect(
      createCheckout(db, input(), key(), newId()),
    ).rejects.toMatchObject({ code: 'AMOUNT_OUT_OF_RANGE' });
    expect(await counts()).toMatchObject({ sessions: 0 });
    const result = await createCheckout(
      db,
      { ...input(), quantity: 1 },
      key(),
      newId(),
    );
    expect(result.order.amount_minor).toBe(Number.MAX_SAFE_INTEGER);
  });

  it('USD exponent and integer quantity totals remain deterministic', async () => {
    await db
      .prepare(
        "UPDATE offers SET price_minor = 1999, currency = 'USD', currency_exponent = 2",
      )
      .run();
    const result = await createCheckout(
      db,
      { ...input(), quantity: 3 },
      key(),
      newId(),
    );
    expect(result.order).toMatchObject({
      amount_minor: 5997,
      currency: 'USD',
      currency_exponent: 2,
    });
  });

  it('audit append-only and physical-request replay dedup do not multiply business events', async () => {
    const idem = key();
    await createCheckout(db, input(), idem, newId());
    const requestId = newId();
    await createCheckout(db, input(), idem, requestId);
    await createCheckout(db, input(), idem, requestId);
    expect(
      (
        await db
          .prepare(
            "SELECT count(*) AS n FROM transaction_events WHERE kind = 'checkout.replayed'",
          )
          .first()
      )?.n,
    ).toBe(1);
    await expect(
      db
        .prepare("UPDATE transaction_events SET kind = 'payment.confirmed'")
        .run(),
    ).rejects.toThrow();
    await expect(
      db.prepare('DELETE FROM transaction_events').run(),
    ).rejects.toThrow();
  });

  it('DB prevents illegal jumps, inconsistent status truth, and unpaid fulfillment', async () => {
    await createCheckout(db, input(), key(), newId());
    await expect(
      db
        .prepare(
          "UPDATE orders SET state = 'FULFILLED', payment_status = 'CONFIRMED', fulfillment_status = 'FULFILLED'",
        )
        .run(),
    ).rejects.toThrow();
    await expect(
      db.prepare("UPDATE orders SET payment_status = 'CONFIRMED'").run(),
    ).rejects.toThrow();
    await expect(
      db.prepare("UPDATE fulfillments SET status = 'PENDING'").run(),
    ).rejects.toThrow();
    await expect(db.prepare('DELETE FROM products').run()).rejects.toThrow();
  });

  it('payment schema enforces one live attempt, provider reference uniqueness, and authoritative amount', async () => {
    const first = await createCheckout(db, input(), key(), newId());
    const second = await createCheckout(db, input(), key(), newId());
    const insert = (order: string, amount: number, reference: string) =>
      db
        .prepare(
          `INSERT INTO payments
      (id, order_id, operation_key_hash, provider, provider_reference, amount_minor, currency, currency_exponent, status, initiated_at)
      VALUES (?, ?, ?, 'test-contract-only', ?, ?, 'IDR', 0, 'PENDING', ?)`,
        )
        .bind(
          newId(),
          order,
          'a'.repeat(64),
          reference,
          amount,
          new Date().toISOString(),
        )
        .run();
    await expect(
      insert(first.order.id, 1, 'amount-mismatch'),
    ).rejects.toThrow();
    await insert(first.order.id, 40000, 'reference-one');
    await expect(
      insert(first.order.id, 40000, 'reference-two'),
    ).rejects.toThrow();
    await expect(
      insert(second.order.id, 40000, 'reference-one'),
    ).rejects.toThrow();
  });

  it('event confirmation uniqueness and fulfillment order uniqueness are DB-enforced', async () => {
    const result = await createCheckout(db, input(), key(), newId());
    const event = (dedup: string) =>
      db
        .prepare(
          `INSERT INTO transaction_events
      (id, order_id, kind, dedup_key, from_state, to_state, correlation_id, request_id, created_at)
      VALUES (?, ?, 'payment.confirmed', ?, 'PAYMENT_PENDING', 'PAYMENT_CONFIRMED', ?, ?, ?)`,
        )
        .bind(
          newId(),
          result.order.id,
          dedup,
          newId(),
          newId(),
          new Date().toISOString(),
        )
        .run();
    await event('one-test-signal');
    await expect(event('another-test-signal')).rejects.toThrow();
    await expect(
      db
        .prepare(
          'INSERT INTO fulfillments SELECT ?, order_id, type, status, delivery_reference, started_at, completed_at, failure_code, created_at, updated_at FROM fulfillments LIMIT 1',
        )
        .bind(newId())
        .run(),
    ).rejects.toThrow();
    // These are isolated schema tests, not a verified payment/event-processing service.
  });
});

describe('compiled protected transaction API', () => {
  it.each([
    { APP_ENV: 'test' },
    { APP_ENV: 'test', TRANSACTION_CORE_ENABLED: 'true' },
    { APP_ENV: 'production', TRANSACTION_CORE_ENABLED: 'true' },
    { APP_ENV: 'invalid', TRANSACTION_CORE_ENABLED: 'true' },
  ])(
    'fails closed with disabled/incomplete/production configuration %j',
    async (configuration) => {
      const env: Bindings = {
        DB: db,
        TRANSACTION_CORE_TOKEN: token,
        ...configuration,
      };
      if (
        configuration.APP_ENV === 'test' &&
        configuration.TRANSACTION_CORE_ENABLED === 'true'
      )
        env.TRANSACTION_CORE_TOKEN = undefined;
      const response = await app.request(
        '/api/transaction-core/checkouts',
        {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + token,
            'Content-Type': 'application/json',
            'Idempotency-Key': key(),
          },
          body: JSON.stringify(input()),
        },
        env,
      );
      expect(response.status).toBe(503);
      expect(await counts()).toMatchObject({ sessions: 0, orders: 0 });
    },
  );

  it('core-enabled readiness fails when the transaction migration is incomplete', async () => {
    await db.prepare('DROP TABLE fulfillments').run();
    expect(
      (await runtime.dispatchFetch('http://test.local/ready')).status,
    ).toBe(503);
  });

  it('rejects malformed references, sources, idempotency keys and non-object inputs', async () => {
    for (const payload of [
      null,
      [],
      { ...input(), offer_id: 'invalid' },
      { ...input(), source_channel: 'customer supplied URL' },
      { ...input(), customer_reference: 'not-a-reference' },
    ]) {
      expect((await api('/checkouts', 'POST', payload)).status).toBe(400);
    }
    expect((await api('/checkouts', 'POST', input(), 'short')).status).toBe(
      400,
    );
    expect(
      (await api('/checkouts', 'POST', input(), 'x'.repeat(129))).status,
    ).toBe(400);
    expect(await counts()).toMatchObject({ sessions: 0 });
  });
  it('creates, replays, and retrieves safe state DTOs', async () => {
    const idem = key();
    const created = await api('/checkouts', 'POST', input(), idem);
    expect(created.status).toBe(201);
    const body = (await created.json()) as {
      data: {
        order: { id: string };
        checkout: { id: string };
        replayed: boolean;
      };
    };
    expect(body.data.replayed).toBe(false);
    const retry = await api('/checkouts', 'POST', input(), idem);
    expect(retry.status).toBe(200);
    expect(await retry.json()).toMatchObject({
      data: { replayed: true, order: { id: body.data.order.id } },
    });
    const order = await api('/orders/' + body.data.order.id);
    expect(order.status).toBe(200);
    const text = await order.text();
    for (const privateField of [
      'delivery_reference',
      'customer_reference',
      'request_hash',
      'idempotency_key_hash',
    ])
      expect(text).not.toContain(privateField);
    expect((await api('/checkouts/' + body.data.checkout.id)).status).toBe(200);
    expect(
      (await runtime.dispatchFetch('http://test.local/ready')).status,
    ).toBe(200);
  });

  it('rejects unauthenticated/wrong-token writes and status reads before exposing records', async () => {
    expect(
      (await api('/checkouts', 'POST', input(), key(), newId() + newId()))
        .status,
    ).toBe(401);
    const noAuth = await runtime.dispatchFetch(
      'http://test.local/api/transaction-core/orders/' + newId(),
    );
    expect(noAuth.status).toBe(401);
    expect(await counts()).toMatchObject({ sessions: 0, orders: 0 });
  });

  it('rejects client price, currency and payment confirmation fields', async () => {
    for (const extra of [
      { amount_minor: 1 },
      { currency: 'USD' },
      { payment_status: 'CONFIRMED' },
      { delivery_reference: 'untrusted' },
    ]) {
      const response = await api('/checkouts', 'POST', {
        ...input(),
        ...extra,
      });
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({ error: 'INVALID_INPUT' });
    }
    expect(await counts()).toMatchObject({ sessions: 0 });
  });

  it.each([0, -1, 1.5, 101, '2'])(
    'rejects invalid quantity %s',
    async (quantity) => {
      const response = await api('/checkouts', 'POST', {
        ...input(),
        quantity,
      });
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        error: 'INVALID_QUANTITY',
      });
    },
  );

  it('handles malformed JSON, bounded bodies, bad content type, missing key, and bad IDs', async () => {
    for (const [body, contentType, expected] of [
      ['{bad', 'application/json', 400],
      ['x'.repeat(2100), 'application/json', 413],
      ['{}', 'text/plain', 400],
    ] as const) {
      const response = await runtime.dispatchFetch(
        'http://test.local/api/transaction-core/checkouts',
        {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + token,
            'Content-Type': contentType,
            'Idempotency-Key': key(),
          },
          body,
        },
      );
      expect(response.status).toBe(expected);
    }
    expect((await api('/checkouts', 'POST', input(), '')).status).toBe(400);
    expect((await api('/orders/bad')).status).toBe(400);
    expect((await api('/orders/' + newId())).status).toBe(404);
  });

  it('returns 409 on conflict and never exposes internal SQL errors', async () => {
    const idem = key();
    await api('/checkouts', 'POST', input(), idem);
    const conflict = await api(
      '/checkouts',
      'POST',
      { ...input(), quantity: 3 },
      idem,
    );
    expect(conflict.status).toBe(409);
    expect(await conflict.json()).toMatchObject({
      error: 'IDEMPOTENCY_CONFLICT',
      request_id: expect.any(String),
    });
    await db
      .prepare(
        "CREATE TRIGGER fault_api BEFORE INSERT ON transaction_events BEGIN SELECT RAISE(ABORT, 'never-leak-this'); END;",
      )
      .run();
    const failure = await api('/checkouts', 'POST', input());
    expect(failure.status).toBe(500);
    expect(await failure.text()).not.toContain('never-leak-this');
  });

  it('has no arbitrary payment/fulfillment transition HTTP endpoints', async () => {
    for (const path of [
      '/payments',
      '/fulfillments',
      '/orders/' + newId() + '/confirm',
    ]) {
      expect((await api(path, 'POST', {})).status).toBe(405);
    }
  });
});

describe('provider-neutral domain contract', () => {
  it('declares the canonical legal lifecycle and rejects terminal resurrection', () => {
    const lifecycle: TransactionState[] = [
      'OFFER_READY',
      'CHECKOUT_STARTED',
      'PAYMENT_PENDING',
      'PAYMENT_CONFIRMED',
      'FULFILLMENT_PENDING',
      'FULFILLED',
    ];
    for (let i = 1; i < lifecycle.length; i++)
      expect(() =>
        assertTransition(lifecycle[i - 1], lifecycle[i]),
      ).not.toThrow();
    for (const terminal of [
      'CANCELLED',
      'PAYMENT_FAILED',
      'PAYMENT_EXPIRED',
      'REFUNDED',
    ] as TransactionState[])
      expect(() => assertTransition(terminal, 'PAYMENT_CONFIRMED')).toThrow();
    expect(() => assertTransition('CHECKOUT_STARTED', 'FULFILLED')).toThrow();
    expect(() =>
      assertTransition('PAYMENT_PENDING', 'PAYMENT_PENDING'),
    ).toThrow();
    expect(() =>
      assertTransition('FULFILLMENT_FAILED', 'FULFILLMENT_PENDING'),
    ).not.toThrow();
  });

  it('normalizes payload IDs and hashes deterministic operation meaning', async () => {
    expect(
      parseCheckout({ ...input(), offer_id: offerId.toUpperCase() }),
    ).toEqual(parseCheckout(input()));
    expect(await hash(JSON.stringify(parseCheckout(input())))).toHaveLength(64);
  });
});
