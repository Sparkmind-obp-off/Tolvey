import { readFileSync } from 'node:fs';
import { Miniflare, convertV4MiniflareOptions, Log, LogLevel } from 'miniflare';
import { beforeEach, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { build } from 'esbuild';
import { newId } from '../src/config';
import { createCheckout, getOrder } from '../src/transaction-store';
import {
  createSimulationCore,
  type OperationContext,
} from '../src/transaction-lifecycle';
import type { VerifiedPaymentSignal } from '../src/transaction-domain';

let runtime: Miniflare;
let db: D1Database;
let core: ReturnType<typeof createSimulationCore>;
let compiledSimulation: string;
// Test-only in-memory harness: never written to public/, dist/ or deployed.
beforeAll(async () => {
  const compiled = await build({
    stdin: {
      resolveDir: '/home/user/webapp',
      contents: `
      import { createSimulationCore } from './src/transaction-lifecycle';
      import { createCheckout } from './src/transaction-store';
      export default { async fetch(request, env) {
        try {
          const core = createSimulationCore(env.DB, env.APP_ENV);
          const input = await request.json();
          const context = {...input.context, now: new Date(input.context.now)};
          const result = input.action === 'checkout'
            ? await createCheckout(env.DB,input.payload,context.key,context.request_id,context.now)
            : await core[input.action](input.order_id,...(input.payload ? [input.payload] : []),context);
          return Response.json(result);
        } catch(error) { return Response.json({error: error.code ?? 'UNEXPECTED'}, {status:error.status ?? 500}); }
      }};`,
    },
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'browser',
    target: 'es2022',
  });
  compiledSimulation = compiled.outputFiles[0].text;
});
const time = new Date('2026-09-30T12:00:00.000Z');
const ctx = (key = 'operation-' + newId(), now = time): OperationContext => ({
  key,
  now,
  request_id: newId(),
});
const checkoutInput = {
  offer_id: '33333333-3333-4333-8333-333333333333',
  quantity: 2,
  source_channel: 'tolvey_direct',
};
async function apply(file: string) {
  const sql = readFileSync(file, 'utf8');
  const parts = sql.includes('-- statement-breakpoint')
    ? sql.split('\n-- statement-breakpoint\n')
    : sql.replace(/^--.*$/gm, '').split(/;\s*(?:\n|$)/);
  await db.batch(
    parts
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => db.prepare(s)),
  );
}
beforeEach(async () => {
  runtime = new Miniflare(
    convertV4MiniflareOptions({
      modules: true,
      script: readFileSync('dist/_worker.js', 'utf8'),
      compatibilityDate: '2026-04-15',
      d1Databases: ['DB'],
      bindings: { APP_ENV: 'test' },
      log: new Log(LogLevel.ERROR),
    }),
  );
  db = (await runtime.getD1Database('DB')) as unknown as D1Database;
  await apply('migrations/0001_canonical_catalog.sql');
  await apply('tests/fixtures/local-catalog.sql');
  await apply('migrations/0002_transaction_core.sql');
  await apply('migrations/0003_transaction_lifecycle.sql');
  core = createSimulationCore(db, 'test');
});
afterEach(async () => {
  await runtime?.dispose();
});
async function checkout() {
  return (
    await createCheckout(
      db,
      checkoutInput,
      'checkout-' + newId(),
      newId(),
      time,
    )
  ).order;
}
async function pending() {
  const order = await checkout();
  const reference = 'SIM-' + newId();
  const initiation = await core.initiatePayment(
    order.id,
    { provider: 'simulation', provider_reference: reference },
    ctx(),
  );
  const signal: VerifiedPaymentSignal = {
    provider: 'simulation',
    provider_reference: reference,
    event_reference: 'event-' + newId(),
    transaction_reference: order.transaction_reference,
    amount_minor: order.amount_minor,
    currency: order.currency,
    currency_exponent: order.currency_exponent,
    status: 'CONFIRMED',
  };
  return { order, signal, initiation };
}
async function paid() {
  const p = await pending();
  await core.processSignal(p.order.id, p.signal, ctx());
  return p;
}
async function count(table: string, where = '') {
  return (await db
    .prepare(`SELECT count(*) AS n FROM ${table} ${where}`)
    .first<{ n: number }>())!.n;
}
async function state(id: string) {
  return (await getOrder(db, id))!.state;
}
async function synced(
  id: string,
  expected: string,
  payment: string,
  fulfillment: string,
  session: string,
) {
  const order = (await getOrder(db, id))!;
  expect(order).toMatchObject({
    state: expected,
    payment_status: payment,
    fulfillment_status: fulfillment,
  });
  expect(
    await db
      .prepare('SELECT status FROM fulfillments WHERE order_id=?')
      .bind(id)
      .first(),
  ).toEqual({ status: fulfillment });
  expect(
    await db
      .prepare('SELECT status FROM checkout_sessions WHERE id=?')
      .bind(order.checkout_session_id)
      .first(),
  ).toEqual({ status: session });
  expect(
    await db
      .prepare('SELECT status FROM payments WHERE order_id=?')
      .bind(id)
      .first(),
  ).toEqual({ status: payment });
  expect((await db.prepare('PRAGMA foreign_key_check').all()).results).toEqual(
    [],
  );
}

describe('provider-neutral internal simulated lifecycle on real D1', () => {
  it('completes canonical lifecycle, immutable receipts and exact money without actual delivery', async () => {
    const { order, signal, initiation } = await pending();
    expect(initiation.receipt).toMatchObject({
      from_state: 'CHECKOUT_STARTED',
      to_state: 'PAYMENT_PENDING',
    });
    await core.processSignal(order.id, signal, ctx());
    await synced(
      order.id,
      'PAYMENT_CONFIRMED',
      'CONFIRMED',
      'BLOCKED',
      'COMPLETED',
    );
    await core.authorizeFulfillment(order.id, ctx());
    await synced(
      order.id,
      'FULFILLMENT_PENDING',
      'CONFIRMED',
      'PENDING',
      'COMPLETED',
    );
    const context = ctx();
    const result = await core.completeFulfillment(order.id, context);
    expect(
      (await core.completeFulfillment(order.id, ctx(context.key))).replayed,
    ).toBe(true);
    expect(result.receipt.to_state).toBe('FULFILLED');
    await synced(order.id, 'FULFILLED', 'CONFIRMED', 'FULFILLED', 'COMPLETED');
    expect(await count('payments')).toBe(1);
    expect(await count('fulfillments')).toBe(1);
    expect(
      await count('transaction_events', "WHERE kind='payment.confirmed'"),
    ).toBe(1);
    expect(
      await count('transaction_events', "WHERE kind='fulfillment.completed'"),
    ).toBe(1);
    expect(
      await db
        .prepare('SELECT amount_minor,currency,currency_exponent FROM payments')
        .first(),
    ).toEqual({ amount_minor: 40000, currency: 'IDR', currency_exponent: 0 });
  });

  it('replays twelve concurrent identical initiations once', async () => {
    const order = await checkout();
    const context = ctx();
    const results = await Promise.all(
      Array.from({ length: 12 }, () =>
        core.initiatePayment(
          order.id,
          { provider: 'simulation', provider_reference: 'attempt-1' },
          ctx(context.key),
        ),
      ),
    );
    expect(results.filter((r) => !r.replayed)).toHaveLength(1);
    expect(new Set(results.map((r) => r.receipt.payment_id)).size).toBe(1);
    expect(await count('payments')).toBe(1);
    expect(
      await count('transaction_events', "WHERE kind='payment.initiated'"),
    ).toBe(1);
  });
  it('replays twelve concurrent confirmations once, including event dedup with new key', async () => {
    const { order, signal } = await pending();
    const context = ctx();
    const results = await Promise.all(
      Array.from({ length: 12 }, (_, index) =>
        core.processSignal(
          order.id,
          signal,
          ctx(context.key, new Date(time.getTime() + index)),
        ),
      ),
    );
    expect(results.filter((r) => !r.replayed)).toHaveLength(1);
    const alias = ctx();
    expect((await core.processSignal(order.id, signal, alias)).replayed).toBe(
      true,
    );
    await expect(
      core.processSignal(
        order.id,
        { ...signal, event_reference: 'changed-event', status: 'FAILED' },
        alias,
      ),
    ).rejects.toMatchObject({ code: 'IDEMPOTENCY_CONFLICT' });
    expect(await count('payments')).toBe(1);
    expect(
      await count('transaction_events', "WHERE kind='payment.confirmed'"),
    ).toBe(1);
    expect(
      await count('transaction_operations', "WHERE operation='payment.signal'"),
    ).toBe(1);
  });
  it('conflicting concurrent same-key payloads produce exactly one winner', async () => {
    const { order, signal } = await pending();
    const context = ctx();
    const results = await Promise.allSettled([
      core.processSignal(order.id, signal, ctx(context.key)),
      core.processSignal(
        order.id,
        { ...signal, status: 'FAILED' },
        ctx(context.key),
      ),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(
      (results.find((r) => r.status === 'rejected') as PromiseRejectedResult)
        .reason.code,
    ).toBe('IDEMPOTENCY_CONFLICT');
    expect(
      await count('transaction_operations', "WHERE operation='payment.signal'"),
    ).toBe(1);
  });
  it.each([
    'provider',
    'provider_reference',
    'transaction_reference',
    'amount_minor',
    'currency',
    'currency_exponent',
  ] as const)('rejects %s mismatch atomically', async (field) => {
    const { order, signal } = await pending();
    const changed = {
      ...signal,
      [field]:
        field === 'amount_minor'
          ? 1
          : field === 'currency_exponent'
            ? 2
            : field === 'currency'
              ? 'USD'
              : 'different-reference',
    };
    await expect(
      core.processSignal(order.id, changed as VerifiedPaymentSignal, ctx()),
    ).rejects.toMatchObject({
      code:
        field.startsWith('currency') || field === 'amount_minor'
          ? 'PAYMENT_MONEY_MISMATCH'
          : 'PAYMENT_REFERENCE_MISMATCH',
    });
    await synced(
      order.id,
      'PAYMENT_PENDING',
      'PENDING',
      'BLOCKED',
      'CHECKOUT_STARTED',
    );
    expect(await count('transaction_operations')).toBe(1);
  });
  it('does not mutate confirmed payment from a new terminal signal or different event', async () => {
    const { order, signal } = await paid();
    const before = await db.prepare('SELECT * FROM payments').first();
    await expect(
      core.processSignal(
        order.id,
        { ...signal, event_reference: 'new-event', status: 'FAILED' },
        ctx(),
      ),
    ).rejects.toMatchObject({ code: 'PAYMENT_TERMINAL' });
    await expect(
      core.processSignal(
        order.id,
        { ...signal, event_reference: 'other-event' },
        ctx(),
      ),
    ).rejects.toMatchObject({ code: 'PAYMENT_TERMINAL' });
    expect(await db.prepare('SELECT * FROM payments').first()).toEqual(before);
  });
  it('rejects conflicting initiation references and operation keys', async () => {
    const order = await checkout();
    const context = ctx();
    await core.initiatePayment(
      order.id,
      { provider: 'simulation', provider_reference: 'ref-1' },
      context,
    );
    await expect(
      core.initiatePayment(
        order.id,
        { provider: 'simulation', provider_reference: 'ref-2' },
        ctx(context.key),
      ),
    ).rejects.toMatchObject({ code: 'IDEMPOTENCY_CONFLICT' });
    await expect(
      core.initiatePayment(
        order.id,
        { provider: 'simulation', provider_reference: 'ref-2' },
        ctx(),
      ),
    ).rejects.toMatchObject({ code: 'ORDER_NOT_PAYABLE' });
    expect(await count('payments')).toBe(1);
  });
  it('rejects unknown order and malformed internal data', async () => {
    await expect(
      core.initiatePayment(
        newId(),
        { provider: 'simulation', provider_reference: 'ref-1' },
        ctx(),
      ),
    ).rejects.toMatchObject({ code: 'ORDER_NOT_FOUND' });
    const { order, signal } = await pending();
    for (const patch of [
      { amount_minor: 0.1 },
      { amount_minor: Number.MAX_SAFE_INTEGER + 1 },
      { currency: 'idr' },
      { currency_exponent: 7 },
      { status: 'PENDING' },
      { extra: 'untrusted' },
    ]) {
      await expect(
        core.processSignal(
          order.id,
          { ...signal, ...patch } as VerifiedPaymentSignal,
          ctx(),
        ),
      ).rejects.toBeDefined();
    }
    await expect(
      core.initiatePayment(
        order.id,
        {
          provider: 'simulation',
          provider_reference: 'ref-1',
          amount_minor: 1,
        },
        ctx(),
      ),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' });
    await expect(
      core.cancelOrder(order.id, ctx('short')),
    ).rejects.toMatchObject({ code: 'INVALID_IDEMPOTENCY_KEY' });
  });
  it('records payment failure, blocks fulfillment and refuses reopen', async () => {
    const { order, signal } = await pending();
    const context = ctx();
    await core.processSignal(
      order.id,
      { ...signal, status: 'FAILED' },
      context,
    );
    expect(
      (
        await core.processSignal(
          order.id,
          { ...signal, status: 'FAILED' },
          ctx(context.key),
        )
      ).replayed,
    ).toBe(true);
    await synced(order.id, 'PAYMENT_FAILED', 'FAILED', 'BLOCKED', 'CANCELLED');
    await expect(
      core.authorizeFulfillment(order.id, ctx()),
    ).rejects.toMatchObject({ code: 'PAYMENT_NOT_CONFIRMED' });
    await expect(
      core.initiatePayment(
        order.id,
        { provider: 'simulation', provider_reference: 'new-ref' },
        ctx(),
      ),
    ).rejects.toMatchObject({ code: 'ORDER_NOT_PAYABLE' });
  });
  it.each([false, true])(
    'expires checkout and pending order/payment (payment exists: %s)',
    async (initiated) => {
      const p = initiated ? await pending() : null;
      const order = p?.order ?? (await checkout());
      await expect(core.expireOrder(order.id, ctx())).rejects.toMatchObject({
        code: 'NOT_EXPIRED',
      });
      const context = ctx(undefined, new Date(time.getTime() + 30 * 60 * 1000));
      await core.expireOrder(order.id, context);
      expect(
        (await core.expireOrder(order.id, ctx(context.key, context.now)))
          .replayed,
      ).toBe(true);
      expect(await state(order.id)).toBe('PAYMENT_EXPIRED');
      if (p) {
        await synced(
          order.id,
          'PAYMENT_EXPIRED',
          'EXPIRED',
          'BLOCKED',
          'EXPIRED',
        );
        await expect(
          core.processSignal(order.id, p.signal, context),
        ).rejects.toMatchObject({ code: 'PAYMENT_TERMINAL' });
      }
      await expect(
        core.initiatePayment(
          order.id,
          { provider: 'simulation', provider_reference: 'new-ref' },
          context,
        ),
      ).rejects.toMatchObject({ code: 'ORDER_NOT_PAYABLE' });
      expect(
        await count('transaction_events', "WHERE kind='payment.expired'"),
      ).toBe(1);
    },
  );
  it.each([false, true])(
    'cancels checkout/order/pending payment (payment exists: %s)',
    async (initiated) => {
      const p = initiated ? await pending() : null;
      const order = p?.order ?? (await checkout());
      const context = ctx();
      await core.cancelOrder(order.id, context);
      expect(
        (await core.cancelOrder(order.id, ctx(context.key))).replayed,
      ).toBe(true);
      expect(await state(order.id)).toBe('CANCELLED');
      if (p) {
        await synced(
          order.id,
          'CANCELLED',
          'CANCELLED',
          'CANCELLED',
          'CANCELLED',
        );
        await expect(
          core.processSignal(order.id, p.signal, ctx()),
        ).rejects.toMatchObject({ code: 'PAYMENT_TERMINAL' });
      }
      await expect(
        core.initiatePayment(
          order.id,
          { provider: 'simulation', provider_reference: 'new-ref' },
          ctx(),
        ),
      ).rejects.toMatchObject({ code: 'ORDER_NOT_PAYABLE' });
    },
  );
  it('rejects overdue initiation/confirmation even before an expiry sweep', async () => {
    const { order, signal } = await pending();
    const late = ctx(undefined, new Date(time.getTime() + 30 * 60 * 1000));
    await expect(
      core.processSignal(order.id, signal, late),
    ).rejects.toMatchObject({ code: 'ORDER_EXPIRED' });
    const other = await checkout();
    await expect(
      core.initiatePayment(
        other.id,
        { provider: 'simulation', provider_reference: 'ref-2' },
        late,
      ),
    ).rejects.toMatchObject({ code: 'ORDER_EXPIRED' });
    await core.expireOrder(order.id, late);
  });
  it('payment-vs-cancel race has one winner and coherent entities', async () => {
    const { order, signal } = await pending();
    const results = await Promise.allSettled([
      core.processSignal(order.id, signal, ctx()),
      core.cancelOrder(order.id, ctx()),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const s = await state(order.id);
    await synced(
      order.id,
      s,
      s === 'CANCELLED' ? 'CANCELLED' : 'CONFIRMED',
      s === 'CANCELLED' ? 'CANCELLED' : 'BLOCKED',
      s === 'CANCELLED' ? 'CANCELLED' : 'COMPLETED',
    );
  });
  it('supports fulfillment failure/retry once without duplicating fulfillment', async () => {
    const { order } = await paid();
    const authorization = ctx();
    await core.authorizeFulfillment(order.id, authorization);
    const failure = ctx();
    await core.failFulfillment(order.id, failure);
    expect(
      (await core.failFulfillment(order.id, ctx(failure.key))).replayed,
    ).toBe(true);
    await synced(
      order.id,
      'FULFILLMENT_FAILED',
      'CONFIRMED',
      'FAILED',
      'COMPLETED',
    );
    // Old successful authorization replay must not reopen the failed fulfillment.
    expect(
      (await core.authorizeFulfillment(order.id, ctx(authorization.key)))
        .replayed,
    ).toBe(true);
    expect(await state(order.id)).toBe('FULFILLMENT_FAILED');
    const retry = ctx();
    await Promise.all(
      Array.from({ length: 8 }, () =>
        core.authorizeFulfillment(order.id, ctx(retry.key)),
      ),
    );
    await core.completeFulfillment(order.id, ctx());
    expect(await count('fulfillments')).toBe(1);
    expect(
      await count('transaction_events', "WHERE kind='fulfillment.authorized'"),
    ).toBe(2);
  });
  it.each([
    'PAYMENT_CONFIRMED',
    'FULFILLMENT_PENDING',
    'FULFILLMENT_FAILED',
    'FULFILLED',
  ])(
    'requests refund from %s, preserving confirmation; no external refund assertion',
    async (target) => {
      const { order } = await paid();
      if (target !== 'PAYMENT_CONFIRMED')
        await core.authorizeFulfillment(order.id, ctx());
      if (target === 'FULFILLMENT_FAILED')
        await core.failFulfillment(order.id, ctx());
      if (target === 'FULFILLED')
        await core.completeFulfillment(order.id, ctx());
      const original = await db
        .prepare(
          'SELECT id,provider,provider_reference,amount_minor,currency,currency_exponent,initiated_at,confirmed_at FROM payments',
        )
        .first();
      const context = ctx();
      await core.requestRefund(order.id, context);
      expect(
        (await core.requestRefund(order.id, ctx(context.key))).replayed,
      ).toBe(true);
      expect((await core.requestRefund(order.id, ctx())).replayed).toBe(true);
      expect(await state(order.id)).toBe('REFUND_PENDING');
      expect(
        await db
          .prepare(
            'SELECT id,provider,provider_reference,amount_minor,currency,currency_exponent,initiated_at,confirmed_at FROM payments',
          )
          .first(),
      ).toEqual(original);
      expect(
        await count('transaction_events', "WHERE kind='refund.pending'"),
      ).toBe(1);
      expect(
        await count('transaction_events', "WHERE kind='refund.completed'"),
      ).toBe(0);
      await expect(
        core.completeFulfillment(order.id, ctx()),
      ).rejects.toMatchObject({ code: 'PAYMENT_NOT_CONFIRMED' });
    },
  );
  it('refund-vs-fulfillment completion race never creates incoherent truth', async () => {
    const { order } = await paid();
    await core.authorizeFulfillment(order.id, ctx());
    const results = await Promise.allSettled([
      core.requestRefund(order.id, ctx()),
      core.completeFulfillment(order.id, ctx()),
    ]);
    const s = await state(order.id);
    expect(['REFUND_PENDING', 'FULFILLED']).toContain(s);
    expect(results.some((r) => r.status === 'fulfilled')).toBe(true);
    const orderRecord = (await getOrder(db, order.id))!;
    expect(
      (await db.prepare('SELECT status FROM fulfillments').first())!.status,
    ).toBe(orderRecord.fulfillment_status);
  });
  it.each([
    'payment.initiated',
    'payment.confirmed',
    'order.cancelled',
    'payment.expired',
    'fulfillment.authorized',
    'fulfillment.completed',
    'fulfillment.failed',
    'refund.pending',
  ])(
    'rolls back entire operation on %s audit failure, then retries safely',
    async (kind) => {
      const p =
        kind === 'payment.initiated'
          ? null
          : kind.startsWith('fulfillment') || kind === 'refund.pending'
            ? await paid()
            : await pending();
      const order = p?.order ?? (await checkout());
      if (kind === 'fulfillment.completed' || kind === 'fulfillment.failed')
        await core.authorizeFulfillment(order.id, ctx());
      const context =
        kind === 'payment.expired'
          ? ctx(undefined, new Date(time.getTime() + 30 * 60 * 1000))
          : ctx();
      const invoke = () =>
        kind === 'payment.initiated'
          ? core.initiatePayment(
              order.id,
              { provider: 'simulation', provider_reference: 'ref-1' },
              context,
            )
          : kind === 'payment.confirmed'
            ? core.processSignal(order.id, p!.signal, context)
            : kind === 'order.cancelled'
              ? core.cancelOrder(order.id, context)
              : kind === 'payment.expired'
                ? core.expireOrder(order.id, context)
                : kind === 'fulfillment.authorized'
                  ? core.authorizeFulfillment(order.id, context)
                  : kind === 'fulfillment.completed'
                    ? core.completeFulfillment(order.id, context)
                    : kind === 'fulfillment.failed'
                      ? core.failFulfillment(order.id, context)
                      : core.requestRefund(order.id, context);
      const snapshot = await db.batch(
        [
          'orders',
          'payments',
          'checkout_sessions',
          'fulfillments',
          'transaction_events',
          'transaction_operations',
          'transaction_operation_keys',
        ].map((t) => db.prepare(`SELECT * FROM ${t}`)),
      );
      await db
        .prepare(
          `CREATE TRIGGER injected_failure BEFORE INSERT ON transaction_events WHEN NEW.kind='${kind}' BEGIN SELECT RAISE(ABORT,'TEST_FAILURE'); END`,
        )
        .run();
      await expect(invoke()).rejects.toMatchObject({
        code: 'TRANSACTION_UNAVAILABLE',
      });
      const after = await db.batch(
        [
          'orders',
          'payments',
          'checkout_sessions',
          'fulfillments',
          'transaction_events',
          'transaction_operations',
          'transaction_operation_keys',
        ].map((t) => db.prepare(`SELECT * FROM ${t}`)),
      );
      expect(after.map((r) => r.results)).toEqual(
        snapshot.map((r) => r.results),
      );
      await db.prepare('DROP TRIGGER injected_failure').run();
      expect((await invoke()).replayed).toBe(false);
      expect((await invoke()).replayed).toBe(true);
    },
  );
  it('invalid transitions, unpaid fulfillment/refund, terminal order and stale context cannot write', async () => {
    const order = await checkout();
    await expect(
      core.authorizeFulfillment(order.id, ctx()),
    ).rejects.toMatchObject({ code: 'PAYMENT_NOT_CONFIRMED' });
    await expect(core.requestRefund(order.id, ctx())).rejects.toMatchObject({
      code: 'INVALID_REFUND',
    });
    const { order: paidOrder } = await paid();
    await expect(
      core.completeFulfillment(paidOrder.id, ctx()),
    ).rejects.toMatchObject({ code: 'INVALID_TRANSITION' });
    await expect(core.cancelOrder(paidOrder.id, ctx())).rejects.toMatchObject({
      code: 'ORDER_TERMINAL',
    });
    await expect(
      core.authorizeFulfillment(
        paidOrder.id,
        ctx(undefined, new Date(time.getTime() - 1)),
      ),
    ).rejects.toMatchObject({ code: 'STALE_CONTEXT' });
  });
  it('runtime rejects simulation in production/staging and exposes no lifecycle HTTP routes', async () => {
    for (const env of ['production', 'staging', 'unknown', ''])
      expect(() => createSimulationCore(db, env)).toThrow(
        'SIMULATION_FORBIDDEN',
      );
    for (const path of [
      'payments',
      'signals',
      'fulfillments',
      'refunds',
      'orders/expire',
    ]) {
      const response = await runtime.dispatchFetch(
        'http://test.local/api/transaction-core/' + path,
        { method: 'POST' },
      );
      expect(response.status).toBe(405);
    }
    await db.prepare('DROP TABLE transaction_operations').run();
    await expect(core.cancelOrder(newId(), ctx())).rejects.toMatchObject({
      code: 'TRANSACTION_UNAVAILABLE',
      message: 'TRANSACTION_UNAVAILABLE',
      status: 503,
    });
  });
  it('guards payment identity/confirmation and operation receipt immutability', async () => {
    const { order } = await paid();
    for (const sql of [
      'UPDATE payments SET amount_minor=1',
      "UPDATE payments SET provider_reference='different'",
      "UPDATE payments SET confirmed_at='changed'",
      "UPDATE payments SET status='PENDING'",
      "UPDATE transaction_operations SET to_state='changed'",
      'DELETE FROM transaction_operations',
      'DELETE FROM transaction_operation_keys',
      "UPDATE checkout_sessions SET status='CHECKOUT_STARTED'",
    ])
      await expect(db.prepare(sql).run()).rejects.toThrow();
    await core.authorizeFulfillment(order.id, ctx());
    await core.completeFulfillment(order.id, ctx());
    await expect(
      db.prepare("UPDATE fulfillments SET status='PENDING'").run(),
    ).rejects.toThrow();
  });
  it('concurrent provider reference reuse across orders produces one attempt and one safe conflict', async () => {
    const a = await checkout(),
      b = await checkout();
    const results = await Promise.allSettled(
      [a, b].map((order) =>
        core.initiatePayment(
          order.id,
          { provider: 'simulation', provider_reference: 'shared-reference' },
          ctx(),
        ),
      ),
    );
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(
      (results.find((r) => r.status === 'rejected') as PromiseRejectedResult)
        .reason.code,
    ).toBe('PAYMENT_REFERENCE_IN_USE');
    expect(await count('payments')).toBe(1);
    expect(await count('transaction_operations')).toBe(1);
  });
  it('repeated expiry and cancellation sweeps with new keys replay the original transition', async () => {
    const a = await pending(),
      b = await pending();
    const late = new Date(time.getTime() + 30 * 60 * 1000);
    await core.expireOrder(a.order.id, ctx(undefined, late));
    expect(
      (await core.expireOrder(a.order.id, ctx(undefined, late))).replayed,
    ).toBe(true);
    await core.cancelOrder(b.order.id, ctx());
    expect((await core.cancelOrder(b.order.id, ctx())).replayed).toBe(true);
    expect(
      await count('transaction_events', "WHERE kind='payment.expired'"),
    ).toBe(1);
    expect(
      await count('transaction_events', "WHERE kind='order.cancelled'"),
    ).toBe(1);
  });
  it('executes compiled lifecycle inside workerd (not just a Node-driven D1 client)', async () => {
    const worker = new Miniflare(
      convertV4MiniflareOptions({
        modules: true,
        script: compiledSimulation,
        compatibilityDate: '2026-04-15',
        d1Databases: ['DB'],
        bindings: { APP_ENV: 'test' },
        log: new Log(LogLevel.ERROR),
      }),
    );
    try {
      const target = (await worker.getD1Database(
        'DB',
      )) as unknown as D1Database;
      const saved = db;
      db = target;
      try {
        for (const file of [
          'migrations/0001_canonical_catalog.sql',
          'tests/fixtures/local-catalog.sql',
          'migrations/0002_transaction_core.sql',
          'migrations/0003_transaction_lifecycle.sql',
        ])
          await apply(file);
        const call = async (
          action: string,
          order_id?: string,
          payload?: unknown,
          context = ctx(),
        ) => {
          const response = await worker.dispatchFetch('http://internal.test/', {
            method: 'POST',
            body: JSON.stringify({ action, order_id, payload, context }),
          });
          expect(response.status).toBe(200);
          return response.json() as Promise<Record<string, unknown>>;
        };
        const result = await call('checkout', undefined, checkoutInput);
        const order = result.order as Awaited<ReturnType<typeof checkout>>;
        await call('initiatePayment', order.id, {
          provider: 'simulation',
          provider_reference: 'workerd-sim',
        });
        const signal = {
          provider: 'simulation',
          provider_reference: 'workerd-sim',
          event_reference: 'workerd-event',
          transaction_reference: order.transaction_reference,
          amount_minor: 40000,
          currency: 'IDR',
          currency_exponent: 0,
          status: 'CONFIRMED',
        };
        const context = ctx();
        const confirmations = await Promise.all(
          Array.from({ length: 6 }, () =>
            call('processSignal', order.id, signal, ctx(context.key)),
          ),
        );
        expect(confirmations.filter((r) => r.replayed === false)).toHaveLength(
          1,
        );
        await call('authorizeFulfillment', order.id);
        await call('failFulfillment', order.id);
        await call('authorizeFulfillment', order.id);
        await call('completeFulfillment', order.id);
        await call('requestRefund', order.id);
        await synced(
          order.id,
          'REFUND_PENDING',
          'REFUND_PENDING',
          'FULFILLED',
          'COMPLETED',
        );
        expect(
          await count('transaction_events', "WHERE kind='payment.confirmed'"),
        ).toBe(1);
      } finally {
        db = saved;
      }
    } finally {
      await worker.dispose();
    }
  });
  it('upgrades existing checkpoint records without rewriting snapshots', async () => {
    // Separate fresh runtime starts at migration 0002, with a representative pending order.
    const upgrade = new Miniflare(
      convertV4MiniflareOptions({
        modules: true,
        script: 'export default {fetch(){return new Response("test")}}',
        compatibilityDate: '2026-04-15',
        d1Databases: ['DB'],
        log: new Log(LogLevel.ERROR),
      }),
    );
    try {
      const target = (await upgrade.getD1Database(
        'DB',
      )) as unknown as D1Database;
      const saved = db;
      db = target;
      try {
        await apply('migrations/0001_canonical_catalog.sql');
        await apply('tests/fixtures/local-catalog.sql');
        await apply('migrations/0002_transaction_core.sql');
        const order = await checkout();
        const before = await getOrder(db, order.id);
        await apply('migrations/0003_transaction_lifecycle.sql');
        const after = await getOrder(db, order.id);
        expect(after).toMatchObject(before!);
        expect((after as unknown as { revision: number }).revision).toBe(0);
        await createSimulationCore(db, 'test').initiatePayment(
          order.id,
          { provider: 'simulation', provider_reference: 'upgrade-ref' },
          ctx(),
        );
        expect(await state(order.id)).toBe('PAYMENT_PENDING');
        expect(
          (await db.prepare('PRAGMA foreign_key_check').all()).results,
        ).toEqual([]);
      } finally {
        db = saved;
      }
    } finally {
      await upgrade.dispose();
    }
  });
});
