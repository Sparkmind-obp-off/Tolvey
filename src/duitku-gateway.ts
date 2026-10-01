import { isId, newId } from './config';
import type { Bindings } from './types';
import {
  hash,
  TransactionError,
  type VerifiedPaymentSignal,
} from './transaction-domain';
import { createPaymentCore } from './transaction-lifecycle';
import { getOrder, verifyTransactionSchema } from './transaction-store';
import { duitkuConfig, DuitkuError } from './duitku-config';
import {
  callbackStatus,
  DuitkuPop,
  payable,
  type AuthenticatedCallback,
} from './duitku-pop';

interface Invoice {
  order_id: string;
  project_hash: string;
  request_hash: string;
  owner_id: string;
  status: string;
  provider_reference: string | null;
  payment_url: string | null;
}
export async function verifyDuitkuSchema(db: D1Database) {
  await verifyTransactionSchema(db);
  await db.batch([
    db.prepare(
      'SELECT order_id,owner_id,request_hash FROM duitku_pop_invoices LIMIT 0',
    ),
    db.prepare(
      'SELECT payload_hash,outcome FROM duitku_pop_notifications LIMIT 0',
    ),
  ]);
}

/** Privileged internal sandbox gateway; no public initiation API. Factory fails closed. */
export function duitkuGateway(
  env: Bindings,
  transport: typeof fetch = (input, init) => globalThis.fetch(input, init),
  clock: () => Date = () => new Date(),
) {
  const config = duitkuConfig(env),
    db = env.DB!;
  // Production credentials are deployed for connection checks only, not live commerce activation.
  if (config.environment === 'production')
    throw new DuitkuError('PAYMENT_EXECUTION_DISABLED', 503);
  const adapter = new DuitkuPop(config, db, transport, clock);
  const core = createPaymentCore(db, env.APP_ENV!);
  const invoice = (id: string) =>
    db
      .prepare('SELECT * FROM duitku_pop_invoices WHERE order_id=?')
      .bind(id)
      .first<Invoice>();
  const projectHash = () => hash('sandbox:' + config.merchantCode);
  async function initiate(orderId: string, input: unknown, requestId: string) {
    if (!isId(orderId) || !isId(requestId)) throw new DuitkuError('INVALID_ID');
    orderId = orderId.toLowerCase();
    if (
      !input ||
      typeof input !== 'object' ||
      Array.isArray(input) ||
      Object.keys(input).some((k) => k !== 'email')
    )
      throw new DuitkuError('INVALID_INPUT');
    const email = (input as { email?: unknown }).email;
    if (
      typeof email !== 'string' ||
      email.length > 255 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    )
      throw new DuitkuError('EMAIL_REQUIRED');
    const meaning = await hash(JSON.stringify({ email })),
      project = await projectHash();
    let row = await invoice(orderId);
    if (row && (row.project_hash !== project || row.request_hash !== meaning))
      throw new DuitkuError('IDEMPOTENCY_CONFLICT', 409);
    const order = await getOrder(db, orderId);
    if (!order) throw new DuitkuError('ORDER_NOT_FOUND', 404);
    if (row?.status === 'READY') {
      if (
        !['CHECKOUT_STARTED', 'PAYMENT_PENDING'].includes(order.state) ||
        clock().toISOString() >= order.expires_at
      )
        throw new DuitkuError('ORDER_NOT_PAYABLE', 409);
      if (order.state === 'CHECKOUT_STARTED')
        await attachPayment(orderId, row.provider_reference!, requestId);
      return {
        provider_reference: row.provider_reference!,
        status: 'PENDING' as const,
        payment_url: row.payment_url!,
        replayed: true,
      };
    }
    payable(order, clock());
    // Reserve before the external side effect. An ambiguous network outcome must NEVER be retried blindly.
    const owner = newId();
    await db
      .prepare(
        `INSERT INTO duitku_pop_invoices(order_id,merchant_order_id,environment,project_hash,request_hash,owner_id,status,created_at)
      SELECT id,id,'sandbox',?,?,?,'RESERVED',? FROM orders WHERE id=? AND state='CHECKOUT_STARTED' AND expires_at>?
      AND NOT EXISTS(SELECT 1 FROM payments WHERE order_id=?) ON CONFLICT DO NOTHING`,
      )
      .bind(
        project,
        meaning,
        owner,
        clock().toISOString(),
        orderId,
        clock().toISOString(),
        orderId,
      )
      .run();
    row = await invoice(orderId);
    if (row?.request_hash !== meaning || row.project_hash !== project)
      throw new DuitkuError('IDEMPOTENCY_CONFLICT', 409);
    if (row.owner_id !== owner)
      throw new DuitkuError('INITIATION_RECONCILIATION_REQUIRED', 409);
    const result = await adapter.initiate(
      {
        order_id: order.id,
        transaction_reference: order.transaction_reference,
        amount_minor: order.amount_minor,
        currency: order.currency,
        currency_exponent: order.currency_exponent,
        idempotency_key: 'duitku.invoice:' + order.id,
      },
      email,
    );
    await db
      .prepare(
        `UPDATE duitku_pop_invoices SET status='READY',provider_reference=?,payment_url=? WHERE order_id=? AND owner_id=? AND status='RESERVED'`,
      )
      .bind(result.provider_reference, result.payment_url, orderId, owner)
      .run();
    await attachPayment(orderId, result.provider_reference, requestId);
    return { ...result, replayed: false };
  }
  async function attachPayment(
    id: string,
    reference: string,
    requestId: string,
  ) {
    // Stable internal key lets retry finish canonical attachment after provider receipt persistence.
    return core.initiatePayment(
      id,
      { provider: adapter.key, provider_reference: reference },
      { key: 'duitku.invoice:' + id, request_id: requestId, now: clock() },
    );
  }
  async function audit(
    wire: AuthenticatedCallback,
    requestId: string,
    outcome: string,
    code: string,
  ) {
    await db
      .prepare(
        `INSERT INTO duitku_pop_notifications(id,order_id,payload_hash,outcome,code,request_id,created_at)
      VALUES (?,(SELECT id FROM orders WHERE id=?),?,?,?,?,?)`,
      )
      .bind(
        newId(),
        wire.order_id,
        wire.payload_hash,
        outcome,
        code,
        requestId,
        clock().toISOString(),
      )
      .run();
  }
  async function callback(request: Request, requestId: string) {
    if (!isId(requestId)) throw new DuitkuError('INVALID_ID');
    const wire = await adapter.authenticate(request); // Invalid authentication is not persisted or logged as raw data.
    try {
      const row = await invoice(wire.order_id);
      if (!row) throw new DuitkuError('ORDER_NOT_FOUND', 404);
      if (
        row.project_hash !== (await projectHash()) ||
        row.status !== 'READY' ||
        row.provider_reference !== wire.reference
      )
        throw new DuitkuError('REFERENCE_MISMATCH', 409);
      const order = await getOrder(db, wire.order_id);
      if (!order) throw new DuitkuError('ORDER_NOT_FOUND', 404);
      if (
        order.amount_minor !== wire.amount ||
        order.currency !== 'IDR' ||
        order.currency_exponent !== 0
      )
        throw new DuitkuError('AMOUNT_MISMATCH', 409);
      const key = 'duitku.callback:' + wire.reference;
      const prior = await db
        .prepare('SELECT id FROM transaction_operations WHERE key_hash=?')
        .bind(await hash('payment.signal:v1:' + key))
        .first();
      let signal: VerifiedPaymentSignal;
      if (prior) {
        // Only authenticated exact fingerprint replays may bypass the provider status read.
        signal = {
          provider: adapter.key,
          provider_reference: wire.reference,
          event_reference: 'notification:' + wire.reference,
          transaction_reference: order.transaction_reference,
          amount_minor: wire.amount,
          currency: 'IDR',
          currency_exponent: 0,
          status: callbackStatus(wire.result),
        };
      } else signal = await adapter.normalize(wire);
      const result = await core.processSignal(order.id, signal, {
        key,
        request_id: requestId,
        now: clock(),
      });
      await audit(
        wire,
        requestId,
        result.replayed ? 'REPLAYED' : 'ACCEPTED',
        'OK',
      );
      // No delivery or automatic fulfillment retry. PAYMENT_CONFIRMED/BLOCKED is deliberate Phase 3 handoff.
      return { replayed: result.replayed };
    } catch (error) {
      const code =
        error instanceof DuitkuError || error instanceof TransactionError
          ? error.code
          : 'PAYMENT_UNAVAILABLE';
      await audit(wire, requestId, 'REJECTED', code);
      throw error;
    }
  }
  // Catch arbitrary transport/SQL errors at service boundary; never leak response/body/secrets.
  function safe<A extends unknown[], R>(fn: (...args: A) => Promise<R>) {
    return async (...args: A) => {
      try {
        return await fn(...args);
      } catch (e) {
        if (e instanceof DuitkuError || e instanceof TransactionError) throw e;
        throw new DuitkuError('PAYMENT_UNAVAILABLE', 503);
      }
    };
  }
  return { initiate: safe(initiate), callback: safe(callback) };
}
