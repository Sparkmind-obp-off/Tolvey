import { readFileSync } from 'node:fs';
import { createHmac } from 'node:crypto';
import { Miniflare, convertV4MiniflareOptions, Log, LogLevel } from 'miniflare';
import { build } from 'esbuild';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { newId } from '../src/config';
import { createCheckout, getOrder } from '../src/transaction-store';
import { createSimulationCore } from '../src/transaction-lifecycle';
import {
  boundedText,
  duitkuConfig,
  equalSignature,
  hmacSha256,
  type DuitkuConfig,
} from '../src/duitku-config';
import { DuitkuPop, POP_CREATE_URL, STATUS_URL } from '../src/duitku-pop';
import { duitkuGateway, verifyDuitkuSchema } from '../src/duitku-gateway';
import app from '../src/index';
import type { Bindings } from '../src/types';

let mf: Miniflare, db: D1Database, env: Bindings, config: DuitkuConfig;
let clock: Date,
  statusCode: string,
  ref: string,
  badStatus: Record<string, unknown>,
  badInvoice: Record<string, unknown>,
  failTransport: boolean;
let transport: ReturnType<typeof vi.fn>;
const time = new Date('2026-10-01T00:00:00.000Z');
const input = {
  offer_id: '33333333-3333-4333-8333-333333333333',
  quantity: 2,
  source_channel: 'tolvey_direct',
};
async function apply(file: string, target = db) {
  const text = readFileSync(file, 'utf8');
  await target.batch(
    (text.includes('-- statement-breakpoint')
      ? text.split('\n-- statement-breakpoint\n')
      : text.replace(/^--.*$/gm, '').split(/;\s*(?:\n|$)/)
    )
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => target.prepare(s)),
  );
}
beforeEach(async () => {
  mf = new Miniflare(
    convertV4MiniflareOptions({
      modules: true,
      script: readFileSync('dist/_worker.js', 'utf8'),
      compatibilityDate: '2026-04-15',
      d1Databases: ['DB'],
      log: new Log(LogLevel.ERROR),
    }),
  );
  db = (await mf.getD1Database('DB')) as unknown as D1Database;
  for (const f of [
    'migrations/0001_canonical_catalog.sql',
    'tests/fixtures/local-catalog.sql',
    'migrations/0002_transaction_core.sql',
    'migrations/0003_transaction_lifecycle.sql',
    'migrations/0004_duitku_pop.sql',
  ])
    await apply(f);
  clock = time;
  statusCode = '00';
  ref = 'contract-reference';
  badStatus = {};
  badInvoice = {};
  failTransport = false;
  // Official documented placeholder and ephemeral test material; NEVER sent to Duitku.
  env = {
    DB: db,
    APP_ENV: 'test',
    DUITKU_POP_ENABLED: 'true',
    DUITKU_ENV: 'sandbox',
    DUITKU_MERCHANT_CODE: 'DXXXX',
    DUITKU_API_KEY: newId() + newId(),
    DUITKU_CALLBACK_URL:
      'https://contract.example/api/provider/duitku-pop/callback',
    DUITKU_RETURN_URL: 'https://contract.example/payments/duitku-pop/return',
  };
  config = duitkuConfig(env);
  transport = vi.fn(async (url: unknown, init?: { body?: unknown }) => {
    if (failTransport) throw new Error('transport deliberately unavailable');
    const body = JSON.parse(String(init?.body));
    if (url === POP_CREATE_URL)
      return Response.json({
        statusCode: '00',
        merchantCode: config.merchantCode,
        reference: ref,
        paymentUrl:
          'https://app-sandbox.duitku.com/redirect_checkout?reference=' + ref,
        ...badInvoice,
      });
    if (url === STATUS_URL)
      return Response.json({
        merchantOrderId: body.merchantOrderId,
        reference: ref,
        amount: '40000',
        statusCode,
        ...badStatus,
      });
    throw new Error('Unexpected outbound endpoint');
  });
});
afterEach(async () => {
  vi.restoreAllMocks();
  await mf?.dispose();
});
const gateway = () =>
  duitkuGateway(env, transport as unknown as typeof fetch, () => clock);
async function order() {
  return (await createCheckout(db, input, 'checkout:' + newId(), newId(), time))
    .order;
}
async function pending() {
  const o = await order();
  await gateway().initiate(o.id, { email: 'contract@example.test' }, newId());
  return o;
}
async function form(id: string, patch: Record<string, string> = {}) {
  const fields = {
    merchantCode: config.merchantCode,
    amount: '40000',
    merchantOrderId: id,
    reference: ref,
    resultCode: '00',
    signature: await hmacSha256(
      config.merchantCode + '40000' + id,
      config.apiKey,
    ),
    ...patch,
  };
  return new URLSearchParams(fields).toString();
}
async function notification(
  id: string,
  patch: Record<string, string> = {},
  suffix = '',
) {
  return new Request(
    'https://contract.example/api/provider/duitku-pop/callback',
    {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: (await form(id, patch)) + suffix,
    },
  );
}
async function count(table: string, where = '') {
  return (await db
    .prepare(`SELECT count(*) AS n FROM ${table} ${where}`)
    .first<{ n: number }>())!.n;
}
async function callback(o: { id: string }, patch: Record<string, string> = {}) {
  return gateway().callback(await notification(o.id, patch), newId());
}
async function assertPending(id: string) {
  expect((await getOrder(db, id))!.state).toBe('PAYMENT_PENDING');
  expect(
    await count('transaction_events', "WHERE kind='payment.confirmed'"),
  ).toBe(0);
}

describe('Duitku POP LOCAL CONTRACT TEST ONLY — no live credentials/network', () => {
  it('implements HMAC SHA256 RFC4231 vector and independent Node formula cross-check', async () => {
    expect(await hmacSha256('Hi There', '\x0b'.repeat(20))).toBe(
      'b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7',
    );
    for (const message of [
      config.merchantCode + String(time.getTime()),
      config.merchantCode + '40000' + 'abcde12345',
      config.merchantCode + 'abcde12345',
    ]) {
      const expected = createHmac('sha256', config.apiKey)
        .update(message)
        .digest('hex');
      expect(
        equalSignature(await hmacSha256(message, config.apiKey), expected),
      ).toBe(true);
      expect(equalSignature('0'.repeat(64), expected)).toBe(false);
      expect(equalSignature('a'.repeat(32), expected)).toBe(false);
    }
  });
  it.each(['production', 'staging', '', 'unknown'])(
    'rejects APP_ENV %s even with sandbox credentials',
    (appEnv) => {
      expect(() => duitkuConfig({ ...env, APP_ENV: appEnv })).toThrow(
        'PAYMENT_UNAVAILABLE',
      );
    },
  );
  it.each([
    'DUITKU_MERCHANT_CODE',
    'DUITKU_API_KEY',
    'DUITKU_CALLBACK_URL',
    'DUITKU_RETURN_URL',
    'DUITKU_ENV',
    'DUITKU_POP_ENABLED',
  ] as const)('fails closed when %s missing', (field) => {
    expect(() => duitkuConfig({ ...env, [field]: undefined })).toThrow(
      'PAYMENT_UNAVAILABLE',
    );
  });
  it.each([
    { DUITKU_ENV: 'production' },
    { DUITKU_POP_ENABLED: 'false' },
    { DUITKU_API_KEY: '' },
    { DUITKU_MERCHANT_CODE: 'bad code' },
    {
      DUITKU_CALLBACK_URL:
        'http://contract.example/api/provider/duitku-pop/callback',
    },
    { DUITKU_RETURN_URL: 'https://other.example/payments/duitku-pop/return' },
    {
      DUITKU_CALLBACK_URL:
        'https://contract.example/api/provider/duitku-pop/callback?secret=x',
    },
  ])('rejects invalid/unsafe configuration %#', (patch) => {
    expect(() => duitkuConfig({ ...env, ...patch })).toThrow(
      'PAYMENT_UNAVAILABLE',
    );
  });
  it('creates POP invoice from canonical amount/UUID and returns only safe normalized result', async () => {
    const o = await order();
    const result = await gateway().initiate(
      o.id,
      { email: 'contract@example.test' },
      newId(),
    );
    expect(result).toMatchObject({
      provider_reference: ref,
      status: 'PENDING',
      replayed: false,
    });
    const [url, request] = transport.mock.calls[0];
    const body = JSON.parse(request.body);
    expect(url).toBe(POP_CREATE_URL);
    expect(body).toMatchObject({
      paymentAmount: 40000,
      merchantOrderId: o.id,
      productDetails: o.offer_name,
      expiryPeriod: 30,
    });
    expect(body).not.toHaveProperty('paymentMethod');
    expect(body).not.toHaveProperty('signature');
    expect(
      equalSignature(
        request.headers['x-duitku-signature'],
        createHmac('sha256', config.apiKey)
          .update(config.merchantCode + String(time.getTime()))
          .digest('hex'),
      ),
    ).toBe(true);
    expect(JSON.stringify(result).includes(config.apiKey)).toBe(false);
    expect(JSON.stringify(result).includes(config.merchantCode)).toBe(false);
    expect((await getOrder(db, o.id))!.state).toBe('PAYMENT_PENDING');
    expect(
      await db
        .prepare(
          'SELECT provider,amount_minor,currency,currency_exponent FROM payments',
        )
        .first(),
    ).toEqual({
      provider: 'duitku-pop-sandbox',
      amount_minor: 40000,
      currency: 'IDR',
      currency_exponent: 0,
    });
    expect(
      (
        await gateway().initiate(
          o.id,
          { email: 'contract@example.test' },
          newId(),
        )
      ).replayed,
    ).toBe(true);
    expect(transport).toHaveBeenCalledTimes(1);
  });
  it('cannot accept client money or a changed initiation meaning', async () => {
    const o = await order();
    await expect(
      gateway().initiate(
        o.id,
        { email: 'contract@example.test', amount_minor: 1 },
        newId(),
      ),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' });
    await gateway().initiate(o.id, { email: 'contract@example.test' }, newId());
    await expect(
      gateway().initiate(o.id, { email: 'other@example.test' }, newId()),
    ).rejects.toMatchObject({ code: 'IDEMPOTENCY_CONFLICT' });
    expect(transport).toHaveBeenCalledTimes(1);
  });
  it('adapter independently rejects forged canonical amount/reference', async () => {
    const o = await order();
    const adapter = new DuitkuPop(
      config,
      db,
      transport as unknown as typeof fetch,
      () => clock,
    );
    await expect(
      adapter.initiate(
        {
          order_id: o.id,
          transaction_reference: o.transaction_reference,
          amount_minor: 1,
          currency: 'IDR',
          currency_exponent: 0,
          idempotency_key: 'contract-test-key',
        },
        'contract@example.test',
      ),
    ).rejects.toMatchObject({ code: 'CANONICAL_MISMATCH' });
    expect(transport).not.toHaveBeenCalled();
  });
  it.each(['cancelled', 'expired', 'paid', 'unknown', 'zero', 'currency'])(
    'rejects %s order before outbound request',
    async (scenario) => {
      let o = await order();
      const core = createSimulationCore(db, 'test');
      if (scenario === 'cancelled')
        await core.cancelOrder(o.id, {
          key: 'cancel:' + newId(),
          request_id: newId(),
          now: clock,
        });
      if (scenario === 'expired') clock = new Date(time.getTime() + 30 * 60000);
      if (scenario === 'paid') {
        await gateway().initiate(
          o.id,
          { email: 'contract@example.test' },
          newId(),
        );
        await callback(o);
        transport.mockClear();
      }
      if (scenario === 'unknown') o = { ...o, id: newId() };
      if (scenario === 'zero' || scenario === 'currency') {
        await db
          .prepare(
            scenario === 'zero'
              ? 'UPDATE offers SET price_minor=0'
              : "UPDATE offers SET currency='USD',currency_exponent=2",
          )
          .run();
        o = await order();
      }
      await expect(
        gateway().initiate(o.id, { email: 'contract@example.test' }, newId()),
      ).rejects.toBeDefined();
      expect(transport).not.toHaveBeenCalled();
    },
  );
  it('prevents concurrent outbound invoice creation and safely replays the persisted receipt', async () => {
    const o = await order();
    const results = await Promise.allSettled(
      Array.from({ length: 10 }, () =>
        gateway().initiate(o.id, { email: 'contract@example.test' }, newId()),
      ),
    );
    expect(results.some((r) => r.status === 'fulfilled')).toBe(true);
    expect(transport).toHaveBeenCalledTimes(1);
    expect(await count('payments')).toBe(1);
    expect(await count('duitku_pop_invoices')).toBe(1);
    expect(
      (
        await gateway().initiate(
          o.id,
          { email: 'contract@example.test' },
          newId(),
        )
      ).replayed,
    ).toBe(true);
  });
  it('ambiguous transport outcome reserves order and blocks blind external retry', async () => {
    const o = await order();
    failTransport = true;
    await expect(
      gateway().initiate(o.id, { email: 'contract@example.test' }, newId()),
    ).rejects.toMatchObject({ code: 'PROVIDER_UNAVAILABLE' });
    failTransport = false;
    await expect(
      gateway().initiate(o.id, { email: 'contract@example.test' }, newId()),
    ).rejects.toMatchObject({ code: 'INITIATION_RECONCILIATION_REQUIRED' });
    expect(transport).toHaveBeenCalledTimes(1);
    expect(await count('payments')).toBe(0);
  });
  it('recovers canonical attachment after persisted provider receipt without creating another invoice', async () => {
    const o = await order();
    await db
      .prepare(
        "CREATE TRIGGER test_fault BEFORE INSERT ON payments BEGIN SELECT RAISE(ABORT,'FAULT'); END",
      )
      .run();
    await expect(
      gateway().initiate(o.id, { email: 'contract@example.test' }, newId()),
    ).rejects.toMatchObject({ code: 'TRANSACTION_UNAVAILABLE' });
    await db.prepare('DROP TRIGGER test_fault').run();
    expect(
      (
        await gateway().initiate(
          o.id,
          { email: 'contract@example.test' },
          newId(),
        )
      ).replayed,
    ).toBe(true);
    expect(transport).toHaveBeenCalledTimes(1);
    expect(await count('payments')).toBe(1);
  });
  it.each([
    { merchantCode: 'other' },
    { statusCode: '01' },
    { paymentUrl: 'https://evil.example/' },
    {
      paymentUrl:
        'https://app-prod.duitku.com/redirect_checkout?reference=contract-reference',
    },
    { reference: '' },
    {
      paymentUrl:
        'https://app-sandbox.duitku.com/redirect_checkout?reference=wrong',
    },
  ])('fails closed on invalid createInvoice response %#', async (patch) => {
    const o = await order();
    badInvoice = patch;
    await expect(
      gateway().initiate(o.id, { email: 'contract@example.test' }, newId()),
    ).rejects.toBeDefined();
    expect(await count('payments')).toBe(0);
  });
  it('confirms authentic matching callback only after server-side status verification, without delivery', async () => {
    const o = await pending();
    expect((await callback(o)).replayed).toBe(false);
    expect((await getOrder(db, o.id))!).toMatchObject({
      state: 'PAYMENT_CONFIRMED',
      payment_status: 'CONFIRMED',
      fulfillment_status: 'BLOCKED',
    });
    expect(transport.mock.calls[1][0]).toBe(STATUS_URL);
    expect(
      await count('transaction_events', "WHERE kind='payment.confirmed'"),
    ).toBe(1);
    expect(
      await count('transaction_events', "WHERE kind='fulfillment.authorized'"),
    ).toBe(0);
    expect(
      await count('duitku_pop_notifications', "WHERE outcome='ACCEPTED'"),
    ).toBe(1);
  });
  it('maps authenticated failure only with provider final status; never fulfills', async () => {
    const o = await pending();
    statusCode = '02';
    await callback(o, { resultCode: '01' });
    expect((await getOrder(db, o.id))!).toMatchObject({
      state: 'PAYMENT_FAILED',
      payment_status: 'FAILED',
      fulfillment_status: 'BLOCKED',
    });
    expect(
      await count('transaction_events', "WHERE kind='payment.confirmed'"),
    ).toBe(0);
  });
  it.each([
    { signature: '0'.repeat(64) },
    { signature: 'a'.repeat(32) },
    { merchantCode: 'other' },
  ])('rejects invalid signature/merchant %#', async (patch) => {
    const o = await pending();
    await expect(
      callback(
        o,
        Object.fromEntries(
          Object.entries(patch).filter(
            (entry): entry is [string, string] => typeof entry[1] === 'string',
          ),
        ),
      ),
    ).rejects.toMatchObject({ status: 401 });
    await assertPending(o.id);
    expect(transport).toHaveBeenCalledTimes(1);
  });
  it.each([
    { amount: '1' },
    { amount: '40000.0' },
    { amount: '040000' },
    { amount: '9007199254740992' },
    { reference: 'wrong' },
    { resultCode: '99' },
  ])('rejects invalid callback amount/reference/status %#', async (patch) => {
    const o = await pending();
    await expect(
      callback(
        o,
        Object.fromEntries(
          Object.entries(patch).filter(
            (entry): entry is [string, string] => typeof entry[1] === 'string',
          ),
        ),
      ),
    ).rejects.toBeDefined();
    await assertPending(o.id);
  });
  it('rejects a correctly signed amount mismatch and unknown order', async () => {
    const o = await pending();
    await expect(
      callback(o, {
        amount: '1',
        signature: await hmacSha256(
          config.merchantCode + '1' + o.id,
          config.apiKey,
        ),
      }),
    ).rejects.toMatchObject({ code: 'AMOUNT_MISMATCH' });
    await expect(callback({ id: newId() })).rejects.toMatchObject({
      code: 'ORDER_NOT_FOUND',
    });
    await assertPending(o.id);
  });
  it.each([
    { amount: '1' },
    { reference: 'wrong' },
    { merchantOrderId: 'wrong' },
    { statusCode: '01' },
    { statusCode: '99' },
  ])('rejects status-service mismatch/pending %#', async (patch) => {
    const o = await pending();
    badStatus = patch;
    await expect(callback(o)).rejects.toBeDefined();
    await assertPending(o.id);
  });
  it('rejects unsigned resultCode tampering even with a valid amount/order signature', async () => {
    const o = await pending();
    statusCode = '02';
    await expect(callback(o)).rejects.toMatchObject({
      code: 'STATUS_NOT_FINAL',
    });
    await assertPending(o.id);
    statusCode = '00';
    await expect(callback(o, { resultCode: '01' })).rejects.toMatchObject({
      code: 'STATUS_NOT_FINAL',
    });
    await assertPending(o.id);
  });
  it('concurrent duplicate callbacks confirm once, exact retries remain safe during provider outage', async () => {
    const o = await pending();
    const results = await Promise.all(
      Array.from({ length: 12 }, () => callback(o)),
    );
    expect(results.filter((r) => !r.replayed)).toHaveLength(1);
    failTransport = true;
    expect((await callback(o)).replayed).toBe(true);
    await expect(callback(o, { resultCode: '01' })).rejects.toMatchObject({
      code: 'IDEMPOTENCY_CONFLICT',
    });
    expect(await count('payments')).toBe(1);
    expect(
      await count('transaction_events', "WHERE kind='payment.confirmed'"),
    ).toBe(1);
    expect(await count('fulfillments')).toBe(1);
    expect(
      await count('duitku_pop_notifications', "WHERE outcome='REJECTED'"),
    ).toBe(1);
  });
  it.each(['cancel', 'expire'])(
    'never reopens %s order on a valid callback',
    async (command) => {
      const o = await pending();
      const core = createSimulationCore(db, 'test');
      if (command === 'expire') clock = new Date(time.getTime() + 30 * 60000);
      await (command === 'cancel' ? core.cancelOrder : core.expireOrder)(o.id, {
        key: 'terminal:' + newId(),
        request_id: newId(),
        now: clock,
      });
      await expect(callback(o)).rejects.toMatchObject({
        code: 'PAYMENT_TERMINAL',
      });
      expect(
        await count('transaction_events', "WHERE kind='payment.confirmed'"),
      ).toBe(0);
    },
  );
  it('rollback on confirmation audit failure can retry the same callback safely', async () => {
    const o = await pending();
    await db
      .prepare(
        "CREATE TRIGGER test_fault BEFORE INSERT ON transaction_events WHEN NEW.kind='payment.confirmed' BEGIN SELECT RAISE(ABORT,'FAULT'); END",
      )
      .run();
    await expect(callback(o)).rejects.toMatchObject({
      code: 'TRANSACTION_UNAVAILABLE',
    });
    await assertPending(o.id);
    await db.prepare('DROP TRIGGER test_fault').run();
    await callback(o);
    expect(
      await count('transaction_events', "WHERE kind='payment.confirmed'"),
    ).toBe(1);
  });
  it('never parses fake verified callback shapes without authentication', async () => {
    const a = new DuitkuPop(
      config,
      db,
      transport as unknown as typeof fetch,
      () => clock,
    );
    await expect(
      a.normalize({
        order_id: newId(),
        reference: ref,
        amount: 40000,
        result: '00',
        payload_hash: '0'.repeat(64),
      }),
    ).rejects.toMatchObject({ status: 401 });
  });
  it.each([
    'json',
    'duplicate',
    'malformed-percent',
    'oversized',
    'missing',
    'invalid-utf8',
  ])('rejects %s callback body', async (kind) => {
    const o = await pending();
    let body = await form(o.id),
      content = 'application/x-www-form-urlencoded';
    if (kind === 'json') {
      body = '{}';
      content = 'application/json';
    }
    if (kind === 'duplicate') body += '&resultCode=01';
    if (kind === 'malformed-percent') body += '&extra=%GG';
    if (kind === 'oversized') body += '&extra=' + 'x'.repeat(8192);
    if (kind === 'missing') body = 'amount=40000';
    if (kind === 'invalid-utf8') body += '&extra=%FF';
    await expect(
      gateway().callback(
        new Request('https://contract.example/', {
          method: 'POST',
          headers: { 'content-type': content },
          body,
        }),
        newId(),
      ),
    ).rejects.toBeDefined();
    await assertPending(o.id);
  });
  it('enforces actual streamed body size, not declared content length', async () => {
    const req = new Request('https://contract.example/', {
      method: 'POST',
      body: 'x'.repeat(8193),
      headers: { 'Content-Length': '1' },
    });
    await expect(boundedText(req, 8192)).rejects.toMatchObject({ status: 413 });
  });
  it('compiled application callback fails closed without sandbox config and production is disabled', async () => {
    const request = await notification(newId());
    const res = await mf.dispatchFetch(request.url, {
      method: 'POST',
      headers: Object.fromEntries(request.headers),
      body: await request.text(),
    });
    expect(res.status).toBe(503);
    for (const APP_ENV of ['production', 'staging']) {
      const response = await app.request(
        'https://contract.example/api/provider/duitku-pop/callback',
        {
          method: 'POST',
          headers: { 'content-type': 'application/x-www-form-urlencoded' },
          body: 'resultCode=00',
        },
        { ...env, APP_ENV },
      );
      expect(response.status).toBe(503);
    }
    const returnResponse = await app.request(
      'https://contract.example/payments/duitku-pop/return?resultCode=00&reference=evil',
      {},
      env,
    );
    expect(returnResponse.status).toBe(200);
    expect(await returnResponse.text()).not.toContain('evil');
    expect(await count('payments')).toBe(0);
  });
  it('HTTP error/logs never contain key, callback body or raw SQL', async () => {
    const log = vi.spyOn(console, 'info').mockImplementation(() => {});
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const response = await app.request(
      'https://contract.example/api/provider/duitku-pop/callback',
      {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: await form(newId(), { signature: '0'.repeat(64) }),
      },
      env,
    );
    expect(response.status).toBe(401);
    const exposed =
      (await response.text()) +
      JSON.stringify([log.mock.calls, error.mock.calls]);
    expect(exposed.includes(config.apiKey)).toBe(false);
    expect(exposed.includes('signature=')).toBe(false);
    expect(exposed.includes('SELECT')).toBe(false);
  });
  it('fresh/upgrade schema readiness and provider history immutability', async () => {
    await verifyDuitkuSchema(db);
    const o = await pending();
    await callback(o);
    expect(
      (await db.prepare('PRAGMA foreign_key_check').all()).results,
    ).toEqual([]);
    for (const sql of [
      'DELETE FROM duitku_pop_invoices',
      "UPDATE duitku_pop_invoices SET provider_reference='wrong'",
      'DELETE FROM duitku_pop_notifications',
      "UPDATE duitku_pop_notifications SET code='changed'",
    ])
      await expect(db.prepare(sql).run()).rejects.toThrow();
  });
  it('runs initiation/callback success+failure in compiled workerd with a strict in-memory provider stub', async () => {
    const compiled = await build({
      stdin: {
        resolveDir: '/home/user/webapp',
        contents: `
      import app from './src/index'; import {duitkuGateway} from './src/duitku-gateway';import {createCheckout} from './src/transaction-store';
      const transport=async (url,init)=>{const p=JSON.parse(init.body); if(url==='${POP_CREATE_URL}') return Response.json({merchantCode:'DXXXX',reference:'ref-'+p.merchantOrderId,paymentUrl:'https://app-sandbox.duitku.com/redirect_checkout?reference=ref-'+p.merchantOrderId,statusCode:'00'});if(url==='${STATUS_URL}') return Response.json({merchantOrderId:p.merchantOrderId,reference:'ref-'+p.merchantOrderId,amount:'40000',statusCode:globalThis.finalStatus??'00'});throw Error('No other network allowed');};
      globalThis.fetch=transport; // Test-only strict stub; no external network is possible.
      export default {async fetch(req,env){const path=new URL(req.url).pathname;try {
        if(path==='/test-init'){const o=await createCheckout(env.DB,${JSON.stringify(input)},'workerd-'+crypto.randomUUID(),crypto.randomUUID()); await duitkuGateway(env,transport).initiate(o.order.id,{email:'contract@example.test'},crypto.randomUUID());return Response.json(o.order);}
        if(path==='/test-notify'){const payload=await req.json(); globalThis.finalStatus=payload.finalStatus;const request=new Request(env.DUITKU_CALLBACK_URL,{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:payload.body});return app.fetch(request,env);}
        return app.fetch(req,env);
      }catch(e){return Response.json({error:e.code??'ERROR'},{status:e.status??500});}}};`,
      },
      bundle: true,
      write: false,
      format: 'esm',
      platform: 'browser',
      target: 'es2022',
    });
    const worker = new Miniflare(
      convertV4MiniflareOptions({
        modules: true,
        script: compiled.outputFiles[0].text,
        compatibilityDate: '2026-04-15',
        d1Databases: ['DB'],
        bindings: {
          ...Object.fromEntries(
            Object.entries(env).filter(([k]) => k !== 'DB'),
          ),
        },
        log: new Log(LogLevel.ERROR),
      }),
    );
    try {
      const target = (await worker.getD1Database(
        'DB',
      )) as unknown as D1Database;
      for (const f of [
        'migrations/0001_canonical_catalog.sql',
        'tests/fixtures/local-catalog.sql',
        'migrations/0002_transaction_core.sql',
        'migrations/0003_transaction_lifecycle.sql',
        'migrations/0004_duitku_pop.sql',
      ])
        await apply(f, target);
      expect(
        (await worker.dispatchFetch('https://contract.example/health')).status,
      ).toBe(200);
      expect(
        (await worker.dispatchFetch('https://contract.example/ready')).status,
      ).toBe(200);
      for (const success of [true, false]) {
        const response = await worker.dispatchFetch(
          'https://contract.example/test-init',
        );
        expect(response.status).toBe(200);
        const o = (await response.json()) as { id: string };
        const body = await form(o.id, {
          reference: 'ref-' + o.id,
          resultCode: success ? '00' : '01',
        });
        const result = await worker.dispatchFetch(
          'https://contract.example/test-notify',
          {
            method: 'POST',
            body: JSON.stringify({ body, finalStatus: success ? '00' : '02' }),
          },
        );
        expect(result.status).toBe(200);
        const duplicate = await worker.dispatchFetch(
          'https://contract.example/test-notify',
          {
            method: 'POST',
            body: JSON.stringify({ body, finalStatus: success ? '00' : '02' }),
          },
        );
        expect(duplicate.status).toBe(200);
        expect(await duplicate.text()).toBe('OK');
        expect(
          (await target
            .prepare(
              "SELECT count(*) AS n FROM transaction_events WHERE order_id=? AND kind IN ('payment.confirmed','payment.failed')",
            )
            .bind(o.id)
            .first())!.n,
        ).toBe(1);
        expect(
          (await target
            .prepare('SELECT state,fulfillment_status FROM orders WHERE id=?')
            .bind(o.id)
            .first())!,
        ).toEqual({
          state: success ? 'PAYMENT_CONFIRMED' : 'PAYMENT_FAILED',
          fulfillment_status: 'BLOCKED',
        });
        const invalid = await worker.dispatchFetch(config.callbackUrl, {
          method: 'POST',
          headers: { 'content-type': 'application/x-www-form-urlencoded' },
          body: body.replace(/signature=[^&]*/, 'signature=' + '0'.repeat(64)),
        });
        expect(invalid.status).toBe(401);
      }
      expect(
        (await target.prepare('PRAGMA foreign_key_check').all()).results,
      ).toEqual([]);
    } finally {
      await worker.dispose();
    }
  });
});
