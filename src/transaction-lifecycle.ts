import { isId, newId } from './config';
import {
  assertTransition,
  hash,
  TransactionError,
  validateIdempotencyKey,
  type TransactionState,
  type VerifiedPaymentSignal,
} from './transaction-domain';
import { getOrder, type OrderRecord } from './transaction-store';

interface LifecycleOrder extends OrderRecord {
  revision: number;
}
interface PaymentRecord {
  id: string;
  order_id: string;
  provider: string;
  provider_reference: string;
  amount_minor: number;
  currency: string;
  currency_exponent: number;
  status: string;
  confirmed_at: string | null;
}
export interface OperationReceipt {
  id: string;
  order_id: string;
  operation: string;
  request_hash: string;
  from_state: string;
  to_state: string;
  payment_id: string | null;
  expected_revision: number;
  created_at: string;
}
export interface OperationContext {
  key: string;
  request_id: string;
  now?: Date;
}
type Operation =
  | 'payment.initiate'
  | 'payment.signal'
  | 'order.expire'
  | 'order.cancel'
  | 'fulfillment.authorize'
  | 'fulfillment.complete'
  | 'fulfillment.fail'
  | 'refund.request';
interface Plan {
  state: TransactionState;
  payment: string;
  fulfillment: string;
  event: string;
  checkout?: string;
  failure?: string;
  paymentId: string | null;
  writes: (
    gate: string,
    bind: (
      sql: string,
      ...args: (string | number | null)[]
    ) => D1PreparedStatement,
  ) => D1PreparedStatement[];
}

function reject(code: string): never {
  throw new TransactionError(code, 409);
}
function identifier(value: unknown, max = 200): asserts value is string {
  if (
    typeof value !== 'string' ||
    !new RegExp(`^[A-Za-z0-9][A-Za-z0-9._:-]{0,${max - 1}}$`).test(value)
  )
    throw new TransactionError('INVALID_REFERENCE');
}
function fields(input: unknown, names: string[]): Record<string, unknown> {
  if (
    !input ||
    typeof input !== 'object' ||
    Array.isArray(input) ||
    Object.keys(input).some((k) => !names.includes(k))
  )
    throw new TransactionError('INVALID_INPUT');
  return input as Record<string, unknown>;
}

/** Internal simulation boundary ONLY. No HTTP route, provider authentication or delivery.
 * Production/staging rejected at runtime; future verified adapters need a separate reviewed gateway.
 * Environment is trusted deployment configuration, never a request/body field.
 */
export function createSimulationCore(db: D1Database, environment: string) {
  if (!['local', 'test'].includes(environment))
    throw new TransactionError('SIMULATION_FORBIDDEN', 503);
  return lifecycleEngine(db);
}

/** Reviewed service-only gateway. No simulation/completion/refund capability exposed.
 * Environment comes from trusted deployment config; callers must authenticate provider signals.
 */
export function createPaymentCore(db: D1Database, environment: string) {
  if (!['local', 'test'].includes(environment))
    throw new TransactionError('PAYMENT_CORE_FORBIDDEN', 503);
  const engine = lifecycleEngine(db);
  return {
    initiatePayment: engine.initiatePayment,
    processSignal: engine.processSignal,
  };
}

function lifecycleEngine(db: D1Database) {
  async function payment(orderId: string) {
    return db
      .prepare(
        'SELECT * FROM payments WHERE order_id = ? ORDER BY initiated_at DESC LIMIT 1',
      )
      .bind(orderId)
      .first<PaymentRecord>();
  }

  async function run(
    orderId: string,
    operation: Operation,
    payload: object,
    context: OperationContext,
    build: (
      order: LifecycleOrder,
      timestamp: string,
      keyHash: string,
    ) => Promise<Plan>,
    signalIdentity: string | null = null,
  ) {
    if (!isId(orderId) || !isId(context.request_id))
      throw new TransactionError('INVALID_CONTEXT');
    validateIdempotencyKey(context.key);
    orderId = orderId.toLowerCase();
    const now = context.now ?? new Date();
    if (!Number.isFinite(now.getTime()))
      throw new TransactionError('INVALID_CONTEXT');
    const timestamp = now.toISOString();
    const keyHash = await hash(operation + ':v1:' + context.key);
    const requestHash = await hash(
      JSON.stringify({ order_id: orderId, ...payload }),
    );
    const prior = () =>
      db
        .prepare(
          `SELECT * FROM transaction_operations WHERE key_hash = ? OR id IN (SELECT operation_id FROM transaction_operation_keys WHERE key_hash = ?) OR (signal_identity = ? AND signal_identity IS NOT NULL) OR (order_id = ? AND operation = ? AND operation IN ('order.expire','order.cancel','refund.request'))`,
        )
        .bind(keyHash, keyHash, signalIdentity, orderId, operation)
        .all<OperationReceipt>();
    const replay = async (rows: OperationReceipt[]) => {
      if (
        rows.some(
          (r) =>
            r.request_hash !== requestHash ||
            r.order_id !== orderId ||
            r.operation !== operation,
        )
      )
        reject('IDEMPOTENCY_CONFLICT');
      const receipt = rows[0];
      await db
        .prepare(
          'INSERT INTO transaction_operation_keys(key_hash,operation_id) VALUES (?,?) ON CONFLICT DO NOTHING',
        )
        .bind(keyHash, receipt.id)
        .run();
      const alias = await db
        .prepare(
          'SELECT operation_id FROM transaction_operation_keys WHERE key_hash=?',
        )
        .bind(keyHash)
        .first<{ operation_id: string }>();
      if (alias?.operation_id !== receipt.id) reject('IDEMPOTENCY_CONFLICT');
      await db
        .prepare(
          'INSERT INTO transaction_operation_replays(operation_id,request_id,created_at) VALUES (?,?,?) ON CONFLICT DO NOTHING',
        )
        .bind(receipt.id, context.request_id, timestamp)
        .run();
      return { receipt, replayed: true };
    };
    let rows = (await prior()).results;
    if (rows.length) return replay(rows);
    const order = (await getOrder(db, orderId)) as LifecycleOrder | null;
    if (!order) throw new TransactionError('ORDER_NOT_FOUND', 404);
    let plan: Plan;
    try {
      // A concurrent winner may have committed after our first receipt read.
      // Recheck replay in catch before rejecting a backdated trusted context.
      if (timestamp < order.updated_at) reject('STALE_CONTEXT');
      plan = await build(order, timestamp, keyHash);
    } catch (error) {
      rows = (await prior()).results;
      if (rows.length) return replay(rows);
      throw error;
    }
    assertTransition(order.state as TransactionState, plan.state);
    const operationId = newId();
    const bind = (sql: string, ...args: (string | number | null)[]) =>
      db.prepare(sql).bind(...args);
    // The newly generated operation UUID is the batch ownership token. All writes require it.
    const gate = `EXISTS (SELECT 1 FROM transaction_operations WHERE id = '${operationId}')`;
    const statements = [
      bind(
        `INSERT INTO transaction_operations
      (id,order_id,operation,key_hash,request_hash,signal_identity,expected_revision,from_state,to_state,payment_id,request_id,created_at)
      SELECT ?,id,?,?,?,?,revision,state,?,?,?,? FROM orders WHERE id = ? AND revision = ? AND state = ? AND updated_at <= ? AND NOT EXISTS (SELECT 1 FROM transaction_operation_keys WHERE key_hash = ?)
      ON CONFLICT DO NOTHING`,
        operationId,
        operation,
        keyHash,
        requestHash,
        signalIdentity,
        plan.state,
        plan.paymentId,
        context.request_id,
        timestamp,
        orderId,
        order.revision,
        order.state,
        timestamp,
        keyHash,
      ),
      bind(
        `INSERT INTO transaction_operation_keys(key_hash,operation_id) SELECT ?,? WHERE ${gate}`,
        keyHash,
        operationId,
      ),
      bind(
        `UPDATE orders SET state=?,payment_status=?,fulfillment_status=?,failure_code=?,updated_at=?,revision=revision+1
        WHERE id=? AND revision=? AND ${gate}`,
        plan.state,
        plan.payment,
        plan.fulfillment,
        plan.failure ?? null,
        timestamp,
        orderId,
        order.revision,
      ),
      ...plan.writes(gate, bind),
    ];
    if (plan.checkout)
      statements.push(
        bind(
          `UPDATE checkout_sessions SET status=? WHERE id=? AND ${gate}`,
          plan.checkout,
          order.checkout_session_id,
        ),
      );
    statements.push(
      bind(
        `INSERT INTO transaction_events
      (id,order_id,kind,dedup_key,from_state,to_state,correlation_id,request_id,created_at)
      SELECT ?,?,?,?,?,?,?,?,? WHERE ${gate}`,
        newId(),
        orderId,
        plan.event,
        operationId,
        order.state,
        plan.state,
        order.correlation_id,
        context.request_id,
        timestamp,
      ),
    );
    try {
      await db.batch(statements);
    } catch (error) {
      rows = (await prior()).results;
      if (rows.length) return replay(rows);
      if (operation === 'payment.initiate') {
        const attempt = payload as {
          provider: string;
          provider_reference: string;
        };
        const collision = await db
          .prepare(
            'SELECT id FROM payments WHERE provider=? AND provider_reference=?',
          )
          .bind(attempt.provider, attempt.provider_reference)
          .first();
        if (collision) reject('PAYMENT_REFERENCE_IN_USE');
      }
      // Never expose SQL/internal errors to callers. A rolled-back operation is retryable.
      throw new TransactionError('TRANSACTION_UNAVAILABLE', 503);
    }
    rows = (await prior()).results;
    if (!rows.length) reject('CONCURRENT_TRANSITION');
    if (rows[0].id !== operationId) return replay(rows);
    return { receipt: rows[0], replayed: false };
  }

  async function initiatePayment(
    orderId: string,
    input: unknown,
    context: OperationContext,
  ) {
    const data = fields(input, ['provider', 'provider_reference']);
    identifier(data.provider, 64);
    identifier(data.provider_reference);
    const provider = data.provider,
      reference = data.provider_reference;
    return run(
      orderId,
      'payment.initiate',
      { provider, provider_reference: reference },
      context,
      async (order, at, keyHash) => {
        if (order.state !== 'CHECKOUT_STARTED') reject('ORDER_NOT_PAYABLE');
        if (at >= order.expires_at) reject('ORDER_EXPIRED');
        if (await payment(order.id)) reject('PAYMENT_ALREADY_EXISTS');
        if (
          await db
            .prepare(
              'SELECT id FROM payments WHERE provider=? AND provider_reference=?',
            )
            .bind(provider, reference)
            .first()
        )
          reject('PAYMENT_REFERENCE_IN_USE');
        const id = newId();
        return {
          state: 'PAYMENT_PENDING',
          payment: 'PENDING',
          fulfillment: 'BLOCKED',
          event: 'payment.initiated',
          paymentId: id,
          writes: (gate, bind) => [
            bind(
              `INSERT INTO payments
          (id,order_id,operation_key_hash,provider,provider_reference,amount_minor,currency,currency_exponent,status,initiated_at)
          SELECT ?,id,?,?,?,amount_minor,currency,currency_exponent,'PENDING',? FROM orders WHERE id=? AND ${gate}`,
              id,
              keyHash,
              provider,
              reference,
              at,
              order.id,
            ),
          ],
        };
      },
    );
  }

  // Accepts trusted INTERNAL simulation signals only, never Request/browser input.
  async function processSignal(
    orderId: string,
    input: VerifiedPaymentSignal,
    context: OperationContext,
  ) {
    const data = fields(input, [
      'provider',
      'provider_reference',
      'event_reference',
      'transaction_reference',
      'amount_minor',
      'currency',
      'currency_exponent',
      'status',
    ]);
    identifier(data.provider, 64);
    identifier(data.provider_reference);
    identifier(data.event_reference);
    identifier(data.transaction_reference);
    if (
      !Number.isSafeInteger(data.amount_minor) ||
      Number(data.amount_minor) < 0 ||
      typeof data.currency !== 'string' ||
      !/^[A-Z]{3}$/.test(data.currency) ||
      !Number.isInteger(data.currency_exponent) ||
      Number(data.currency_exponent) < 0 ||
      Number(data.currency_exponent) > 6 ||
      !['CONFIRMED', 'FAILED'].includes(String(data.status))
    )
      throw new TransactionError('INVALID_SIGNAL');
    const signal = {
      provider: data.provider,
      provider_reference: data.provider_reference,
      event_reference: data.event_reference,
      transaction_reference: data.transaction_reference,
      amount_minor: data.amount_minor,
      currency: data.currency,
      currency_exponent: data.currency_exponent,
      status: data.status,
    };
    const identity = await hash(
      JSON.stringify([signal.provider, signal.event_reference]),
    );
    return run(
      orderId,
      'payment.signal',
      signal,
      context,
      async (order, at) => {
        const p = await payment(order.id);
        if (
          !p ||
          p.provider !== signal.provider ||
          p.provider_reference !== signal.provider_reference ||
          order.transaction_reference !== signal.transaction_reference
        )
          reject('PAYMENT_REFERENCE_MISMATCH');
        if (
          p.amount_minor !== signal.amount_minor ||
          order.amount_minor !== signal.amount_minor ||
          p.currency !== signal.currency ||
          order.currency !== signal.currency ||
          p.currency_exponent !== signal.currency_exponent ||
          order.currency_exponent !== signal.currency_exponent
        )
          reject('PAYMENT_MONEY_MISMATCH');
        if (order.state !== 'PAYMENT_PENDING' || p.status !== 'PENDING')
          reject('PAYMENT_TERMINAL');
        if (at >= order.expires_at) reject('ORDER_EXPIRED');
        const confirmed = signal.status === 'CONFIRMED';
        return {
          state: confirmed ? 'PAYMENT_CONFIRMED' : 'PAYMENT_FAILED',
          payment: confirmed ? 'CONFIRMED' : 'FAILED',
          fulfillment: 'BLOCKED',
          event: confirmed ? 'payment.confirmed' : 'payment.failed',
          paymentId: p.id,
          checkout: confirmed ? 'COMPLETED' : 'CANCELLED',
          failure: confirmed ? undefined : 'PAYMENT_DECLINED',
          writes: (gate, bind) => [
            bind(
              `UPDATE payments SET status=?,${confirmed ? 'confirmed_at' : 'failed_at'}=?,failure_code=?
          WHERE id=? AND status='PENDING' AND ${gate}`,
              confirmed ? 'CONFIRMED' : 'FAILED',
              at,
              confirmed ? null : 'PAYMENT_DECLINED',
              p.id,
            ),
          ],
        };
      },
      identity,
    );
  }

  async function terminate(
    orderId: string,
    operation: 'order.expire' | 'order.cancel',
    context: OperationContext,
  ) {
    return run(orderId, operation, {}, context, async (order, at) => {
      if (!['CHECKOUT_STARTED', 'PAYMENT_PENDING'].includes(order.state))
        reject('ORDER_TERMINAL');
      if (operation === 'order.expire' && at < order.expires_at)
        reject('NOT_EXPIRED');
      const expired = operation === 'order.expire';
      const p = await payment(order.id);
      return {
        state: expired ? 'PAYMENT_EXPIRED' : 'CANCELLED',
        payment: expired ? 'EXPIRED' : 'CANCELLED',
        fulfillment: expired ? 'BLOCKED' : 'CANCELLED',
        event: expired ? 'payment.expired' : 'order.cancelled',
        paymentId: p?.id ?? null,
        checkout: expired ? 'EXPIRED' : 'CANCELLED',
        failure: expired ? 'CHECKOUT_EXPIRED' : 'ORDER_CANCELLED',
        writes: (gate, bind) => [
          bind(
            `UPDATE payments SET status=?,failed_at=?,failure_code=? WHERE order_id=? AND status='PENDING' AND ${gate}`,
            expired ? 'EXPIRED' : 'CANCELLED',
            at,
            expired ? 'CHECKOUT_EXPIRED' : 'ORDER_CANCELLED',
            order.id,
          ),
          ...(expired
            ? []
            : [
                bind(
                  `UPDATE fulfillments SET status='CANCELLED',updated_at=? WHERE order_id=? AND ${gate}`,
                  at,
                  order.id,
                ),
              ]),
        ],
      };
    });
  }

  async function fulfill(
    orderId: string,
    action: 'authorize' | 'complete' | 'fail',
    context: OperationContext,
  ) {
    return run(
      orderId,
      `fulfillment.${action}`,
      {},
      context,
      async (order, at) => {
        const p = await payment(order.id);
        if (
          !p ||
          p.status !== 'CONFIRMED' ||
          order.payment_status !== 'CONFIRMED'
        )
          reject('PAYMENT_NOT_CONFIRMED');
        if (
          action === 'authorize'
            ? !['PAYMENT_CONFIRMED', 'FULFILLMENT_FAILED'].includes(order.state)
            : order.state !== 'FULFILLMENT_PENDING'
        )
          reject('INVALID_TRANSITION');
        const status =
          action === 'authorize'
            ? 'PENDING'
            : action === 'complete'
              ? 'FULFILLED'
              : 'FAILED';
        return {
          state:
            action === 'authorize'
              ? 'FULFILLMENT_PENDING'
              : action === 'complete'
                ? 'FULFILLED'
                : 'FULFILLMENT_FAILED',
          payment: 'CONFIRMED',
          fulfillment: status,
          event:
            action === 'authorize'
              ? 'fulfillment.authorized'
              : action === 'complete'
                ? 'fulfillment.completed'
                : 'fulfillment.failed',
          paymentId: p.id,
          failure: action === 'fail' ? 'FULFILLMENT_FAILED' : undefined,
          writes: (gate, bind) => [
            bind(
              `UPDATE fulfillments SET status=?,started_at=COALESCE(started_at,?),completed_at=?,failure_code=?,updated_at=?
          WHERE order_id=? AND ${gate}`,
              status,
              at,
              action === 'complete' ? at : null,
              action === 'fail' ? 'FULFILLMENT_FAILED' : null,
              at,
              order.id,
            ),
          ],
        };
      },
    );
  }

  async function requestRefund(orderId: string, context: OperationContext) {
    return run(orderId, 'refund.request', {}, context, async (order, at) => {
      const p = await payment(order.id);
      if (
        !p ||
        p.status !== 'CONFIRMED' ||
        ![
          'PAYMENT_CONFIRMED',
          'FULFILLMENT_PENDING',
          'FULFILLMENT_FAILED',
          'FULFILLED',
        ].includes(order.state)
      )
        reject('INVALID_REFUND');
      const cancel = order.state === 'FULFILLMENT_PENDING';
      return {
        state: 'REFUND_PENDING',
        payment: 'REFUND_PENDING',
        fulfillment: cancel ? 'CANCELLED' : order.fulfillment_status,
        event: 'refund.pending',
        paymentId: p.id,
        writes: (gate, bind) => [
          bind(
            `UPDATE payments SET status='REFUND_PENDING' WHERE id=? AND ${gate}`,
            p.id,
          ),
          ...(cancel
            ? [
                bind(
                  `UPDATE fulfillments SET status='CANCELLED',updated_at=? WHERE order_id=? AND ${gate}`,
                  at,
                  order.id,
                ),
              ]
            : []),
        ],
      };
    });
  }

  // Also sanitize failures during reads/replay, not only failed mutation batches.
  function safe<Args extends unknown[], Result>(
    fn: (...args: Args) => Promise<Result>,
  ) {
    return async (...args: Args): Promise<Result> => {
      try {
        return await fn(...args);
      } catch (error) {
        if (error instanceof TransactionError) throw error;
        throw new TransactionError('TRANSACTION_UNAVAILABLE', 503);
      }
    };
  }
  return {
    initiatePayment: safe(initiatePayment),
    processSignal: safe(processSignal),
    expireOrder: safe((id: string, ctx: OperationContext) =>
      terminate(id, 'order.expire', ctx),
    ),
    cancelOrder: safe((id: string, ctx: OperationContext) =>
      terminate(id, 'order.cancel', ctx),
    ),
    authorizeFulfillment: safe((id: string, ctx: OperationContext) =>
      fulfill(id, 'authorize', ctx),
    ),
    completeFulfillment: safe((id: string, ctx: OperationContext) =>
      fulfill(id, 'complete', ctx),
    ),
    failFulfillment: safe((id: string, ctx: OperationContext) =>
      fulfill(id, 'fail', ctx),
    ),
    requestRefund: safe(requestRefund),
  };
}
