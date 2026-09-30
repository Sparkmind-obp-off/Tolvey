import { isId, newId } from './config';
import {
  hash,
  parseCheckout,
  TransactionError,
  validateIdempotencyKey,
} from './transaction-domain';

export interface CheckoutRecord {
  id: string;
  request_hash: string;
  offer_id: string;
  product_id: string;
  product_version_id: string;
  quantity: number;
  unit_price_minor: number;
  amount_minor: number;
  currency: string;
  currency_exponent: number;
  product_name: string;
  offer_name: string;
  version_label: string;
  delivery_reference: string;
  source_channel: string;
  customer_reference: string | null;
  correlation_id: string;
  status: string;
  created_at: string;
  expires_at: string;
}
export interface OrderRecord extends Omit<
  CheckoutRecord,
  'request_hash' | 'status'
> {
  checkout_session_id: string;
  transaction_reference: string;
  state: string;
  payment_status: string;
  fulfillment_status: string;
  updated_at: string;
}

export async function verifyTransactionSchema(db: D1Database): Promise<void> {
  await db.batch([
    db.prepare('SELECT id, request_hash FROM checkout_sessions LIMIT 0'),
    db.prepare(
      'SELECT id, state, payment_status, revision FROM orders LIMIT 0',
    ),
    db.prepare('SELECT id, provider, status FROM payments LIMIT 0'),
    db.prepare('SELECT id, status FROM fulfillments LIMIT 0'),
    db.prepare('SELECT id, dedup_key FROM transaction_events LIMIT 0'),
    db.prepare(
      'SELECT id, expected_revision FROM transaction_operations LIMIT 0',
    ),
    db.prepare('SELECT key_hash FROM transaction_operation_keys LIMIT 0'),
    db.prepare(
      'SELECT operation_id FROM transaction_operation_replays LIMIT 0',
    ),
  ]);
}

export async function getOrder(
  db: D1Database,
  id: string,
): Promise<OrderRecord | null> {
  if (!isId(id)) throw new TransactionError('INVALID_ID');
  return db
    .prepare('SELECT * FROM orders WHERE id = ?')
    .bind(id.toLowerCase())
    .first<OrderRecord>();
}
export async function getCheckout(
  db: D1Database,
  id: string,
): Promise<CheckoutRecord | null> {
  if (!isId(id)) throw new TransactionError('INVALID_ID');
  return db
    .prepare('SELECT * FROM checkout_sessions WHERE id = ?')
    .bind(id.toLowerCase())
    .first<CheckoutRecord>();
}

export function checkoutDto(row: CheckoutRecord) {
  return {
    id: row.id,
    offer_id: row.offer_id,
    product_id: row.product_id,
    product_version_id: row.product_version_id,
    quantity: row.quantity,
    unit_price_minor: row.unit_price_minor,
    amount_minor: row.amount_minor,
    currency: row.currency,
    currency_exponent: row.currency_exponent,
    source_channel: row.source_channel,
    status: row.status,
    correlation_id: row.correlation_id,
    created_at: row.created_at,
    expires_at: row.expires_at,
  };
}
export function orderDto(row: OrderRecord) {
  return {
    id: row.id,
    transaction_reference: row.transaction_reference,
    checkout_session_id: row.checkout_session_id,
    offer_id: row.offer_id,
    product_id: row.product_id,
    product_version_id: row.product_version_id,
    quantity: row.quantity,
    unit_price_minor: row.unit_price_minor,
    amount_minor: row.amount_minor,
    currency: row.currency,
    currency_exponent: row.currency_exponent,
    product_name: row.product_name,
    offer_name: row.offer_name,
    version_label: row.version_label,
    source_channel: row.source_channel,
    state: row.state,
    payment_status: row.payment_status,
    fulfillment_status: row.fulfillment_status,
    correlation_id: row.correlation_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    expires_at: row.expires_at,
  };
}

// D1 batch is one atomic transaction. INSERT ... SELECT rechecks ACTIVE parents
// and calculates snapshot totals at write time, not from a stale JS price read.
export async function createCheckout(
  db: D1Database,
  input: unknown,
  key: string,
  requestId: string,
  now = new Date(),
) {
  const data = parseCheckout(input);
  validateIdempotencyKey(key);
  if (!isId(requestId) || !Number.isFinite(now.getTime()))
    throw new TransactionError('INVALID_CONTEXT');
  const keyHash = await hash('checkout.create:v1:' + key);
  const requestHash = await hash(JSON.stringify(data));
  const prior = await db
    .prepare('SELECT * FROM checkout_sessions WHERE idempotency_key_hash = ?')
    .bind(keyHash)
    .first<CheckoutRecord>();
  if (prior) {
    return replay(db, prior, requestHash, requestId, now.toISOString());
  }
  const sessionId = newId();
  const orderId = newId();
  const created = now.toISOString();
  const expires = new Date(now.getTime() + 30 * 60 * 1000).toISOString();
  const correlationId = requestId;
  const uuidReference = 'TV-' + orderId.replaceAll('-', '').toUpperCase();
  const maxUnitPrice = Number(
    BigInt(Number.MAX_SAFE_INTEGER) / BigInt(data.quantity),
  );
  const session = db
    .prepare(
      `INSERT INTO checkout_sessions (
      id, idempotency_key_hash, request_hash, offer_id, product_id, product_version_id,
      quantity, unit_price_minor, amount_minor, currency, currency_exponent,
      product_name, offer_name, version_label, delivery_reference, source_channel,
      customer_reference, correlation_id, created_at, expires_at
    ) SELECT ?, ?, ?, o.id, o.product_id, o.product_version_id,
      ?, o.price_minor, o.price_minor * ?, o.currency, o.currency_exponent,
      p.name, o.name, v.version, o.delivery_reference, ?, ?, ?, ?, ?
    FROM offers o JOIN products p ON p.id = o.product_id
    JOIN product_versions v ON v.id = o.product_version_id AND v.product_id = o.product_id
    WHERE o.id = ? AND o.status = 'ACTIVE' AND p.status = 'ACTIVE' AND v.status = 'ACTIVE'
      AND o.price_minor <= ?
    ON CONFLICT(idempotency_key_hash) DO NOTHING`,
    )
    .bind(
      sessionId,
      keyHash,
      requestHash,
      data.quantity,
      data.quantity,
      data.source_channel,
      data.customer_reference,
      correlationId,
      created,
      expires,
      data.offer_id,
      maxUnitPrice,
    );
  const order = db
    .prepare(
      `INSERT INTO orders (
      id, transaction_reference, checkout_session_id, offer_id, product_id, product_version_id,
      quantity, unit_price_minor, amount_minor, currency, currency_exponent,
      product_name, offer_name, version_label, delivery_reference, source_channel,
      customer_reference, correlation_id, created_at, updated_at, expires_at
    ) SELECT ?, ?, id, offer_id, product_id, product_version_id, quantity,
      unit_price_minor, amount_minor, currency, currency_exponent, product_name,
      offer_name, version_label, delivery_reference, source_channel, customer_reference,
      correlation_id, created_at, created_at, expires_at
    FROM checkout_sessions WHERE id = ?`,
    )
    .bind(orderId, uuidReference, sessionId);
  const fulfillment = db
    .prepare(
      `INSERT INTO fulfillments (id, order_id, delivery_reference, created_at, updated_at)
    SELECT ?, id, delivery_reference, created_at, created_at FROM orders WHERE id = ?`,
    )
    .bind(newId(), orderId);
  const event = (kind: string, from: string) =>
    db
      .prepare(
        `INSERT INTO transaction_events
    (id, order_id, kind, dedup_key, from_state, to_state, correlation_id, request_id, created_at)
    SELECT ?, id, ?, 'creation', ?, state, correlation_id, ?, created_at FROM orders WHERE id = ?`,
      )
      .bind(newId(), kind, from, requestId, orderId);
  await db.batch([
    session,
    order,
    fulfillment,
    event('checkout.started', 'OFFER_READY'),
    event('order.created', 'CHECKOUT_STARTED'),
  ]);
  const persisted = await db
    .prepare('SELECT * FROM checkout_sessions WHERE idempotency_key_hash = ?')
    .bind(keyHash)
    .first<CheckoutRecord>();
  if (!persisted) {
    const offer = await db
      .prepare(
        `SELECT o.price_minor FROM offers o
      JOIN products p ON p.id = o.product_id JOIN product_versions v ON v.id = o.product_version_id
      WHERE o.id = ? AND o.status = 'ACTIVE' AND p.status = 'ACTIVE' AND v.status = 'ACTIVE'`,
      )
      .bind(data.offer_id)
      .first<{ price_minor: number }>();
    if (offer && offer.price_minor > maxUnitPrice)
      throw new TransactionError('AMOUNT_OUT_OF_RANGE');
    throw new TransactionError('OFFER_UNAVAILABLE', 404);
  }
  if (persisted.id !== sessionId)
    return replay(db, persisted, requestHash, requestId, created);
  const persistedOrder = await db
    .prepare('SELECT * FROM orders WHERE checkout_session_id = ?')
    .bind(persisted.id)
    .first<OrderRecord>();
  if (!persistedOrder)
    throw new TransactionError('TRANSACTION_UNAVAILABLE', 503);
  return {
    checkout: checkoutDto(persisted),
    order: orderDto(persistedOrder),
    replayed: false,
  };
}

async function replay(
  db: D1Database,
  prior: CheckoutRecord,
  requestHash: string,
  requestId: string,
  now: string,
) {
  if (prior.request_hash !== requestHash)
    throw new TransactionError('IDEMPOTENCY_CONFLICT', 409);
  const order = await db
    .prepare('SELECT * FROM orders WHERE checkout_session_id = ?')
    .bind(prior.id)
    .first<OrderRecord>();
  if (!order) throw new TransactionError('TRANSACTION_UNAVAILABLE', 503);
  await db
    .prepare(
      `INSERT INTO transaction_events
    (id, order_id, kind, dedup_key, from_state, to_state, correlation_id, request_id, is_duplicate, created_at)
    VALUES (?, ?, 'checkout.replayed', ?, ?, ?, ?, ?, 1, ?)
    ON CONFLICT(order_id, kind, dedup_key) DO NOTHING`,
    )
    .bind(
      newId(),
      order.id,
      requestId,
      order.state,
      order.state,
      order.correlation_id,
      requestId,
      now,
    )
    .run();
  return {
    checkout: checkoutDto(prior),
    order: orderDto(order),
    replayed: true,
  };
}
