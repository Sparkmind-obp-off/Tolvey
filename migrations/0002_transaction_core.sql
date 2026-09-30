-- Phase 2 checkpoint: durable transaction records, not provider execution.
-- statement-breakpoint delimits complete statements for the workerd test harness.
CREATE UNIQUE INDEX offers_transaction_context ON offers(id, product_id, product_version_id);
-- statement-breakpoint
CREATE TABLE checkout_sessions (
  id TEXT PRIMARY KEY NOT NULL CHECK(length(id) = 36),
  idempotency_key_hash TEXT NOT NULL UNIQUE CHECK(length(idempotency_key_hash) = 64),
  request_hash TEXT NOT NULL CHECK(length(request_hash) = 64),
  offer_id TEXT NOT NULL REFERENCES offers(id) ON DELETE RESTRICT,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_version_id TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK(quantity BETWEEN 1 AND 100),
  unit_price_minor INTEGER NOT NULL CHECK(unit_price_minor BETWEEN 0 AND 9007199254740991),
  amount_minor INTEGER NOT NULL CHECK(amount_minor BETWEEN 0 AND 9007199254740991 AND amount_minor = unit_price_minor * quantity),
  currency TEXT NOT NULL CHECK(length(currency) = 3 AND currency NOT GLOB '*[^A-Z]*'),
  currency_exponent INTEGER NOT NULL CHECK(currency_exponent BETWEEN 0 AND 6),
  product_name TEXT NOT NULL,
  offer_name TEXT NOT NULL,
  version_label TEXT NOT NULL,
  delivery_reference TEXT NOT NULL,
  source_channel TEXT NOT NULL CHECK(length(source_channel) BETWEEN 1 AND 64),
  customer_reference TEXT CHECK(customer_reference IS NULL OR length(customer_reference) = 36),
  correlation_id TEXT NOT NULL CHECK(length(correlation_id) = 36),
  status TEXT NOT NULL DEFAULT 'CHECKOUT_STARTED' CHECK(status IN ('CHECKOUT_STARTED', 'COMPLETED', 'EXPIRED', 'CANCELLED')),
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL CHECK(expires_at > created_at),
  FOREIGN KEY(product_id, product_version_id) REFERENCES product_versions(product_id, id) ON DELETE RESTRICT,
  FOREIGN KEY(offer_id, product_id, product_version_id) REFERENCES offers(id, product_id, product_version_id) ON DELETE RESTRICT
) STRICT;
-- statement-breakpoint
CREATE TABLE orders (
  id TEXT PRIMARY KEY NOT NULL CHECK(length(id) = 36),
  transaction_reference TEXT NOT NULL UNIQUE,
  checkout_session_id TEXT NOT NULL UNIQUE REFERENCES checkout_sessions(id) ON DELETE RESTRICT,
  offer_id TEXT NOT NULL REFERENCES offers(id) ON DELETE RESTRICT,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_version_id TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK(quantity BETWEEN 1 AND 100),
  unit_price_minor INTEGER NOT NULL CHECK(unit_price_minor BETWEEN 0 AND 9007199254740991),
  amount_minor INTEGER NOT NULL CHECK(amount_minor BETWEEN 0 AND 9007199254740991 AND amount_minor = unit_price_minor * quantity),
  currency TEXT NOT NULL CHECK(length(currency) = 3 AND currency NOT GLOB '*[^A-Z]*'),
  currency_exponent INTEGER NOT NULL CHECK(currency_exponent BETWEEN 0 AND 6),
  product_name TEXT NOT NULL,
  offer_name TEXT NOT NULL,
  version_label TEXT NOT NULL,
  delivery_reference TEXT NOT NULL,
  source_channel TEXT NOT NULL,
  customer_reference TEXT,
  correlation_id TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'CHECKOUT_STARTED' CHECK(state IN ('CHECKOUT_STARTED', 'PAYMENT_PENDING', 'PAYMENT_CONFIRMED', 'FULFILLMENT_PENDING', 'FULFILLED', 'PAYMENT_FAILED', 'PAYMENT_EXPIRED', 'CANCELLED', 'FULFILLMENT_FAILED', 'REFUND_PENDING', 'REFUNDED')),
  payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK(payment_status IN ('PENDING', 'CONFIRMED', 'FAILED', 'EXPIRED', 'CANCELLED', 'REFUND_PENDING', 'REFUNDED')),
  fulfillment_status TEXT NOT NULL DEFAULT 'BLOCKED' CHECK(fulfillment_status IN ('BLOCKED', 'PENDING', 'IN_PROGRESS', 'FULFILLED', 'FAILED', 'CANCELLED')),
  failure_code TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  FOREIGN KEY(product_id, product_version_id) REFERENCES product_versions(product_id, id) ON DELETE RESTRICT,
  UNIQUE(id, amount_minor, currency, currency_exponent),
  FOREIGN KEY(offer_id, product_id, product_version_id) REFERENCES offers(id, product_id, product_version_id) ON DELETE RESTRICT,
  CHECK(
    (state IN ('CHECKOUT_STARTED', 'PAYMENT_PENDING') AND payment_status = 'PENDING' AND fulfillment_status = 'BLOCKED') OR
    (state = 'PAYMENT_CONFIRMED' AND payment_status = 'CONFIRMED' AND fulfillment_status = 'BLOCKED') OR
    (state = 'FULFILLMENT_PENDING' AND payment_status = 'CONFIRMED' AND fulfillment_status IN ('PENDING', 'IN_PROGRESS')) OR
    (state = 'FULFILLED' AND payment_status = 'CONFIRMED' AND fulfillment_status = 'FULFILLED') OR
    (state = 'FULFILLMENT_FAILED' AND payment_status = 'CONFIRMED' AND fulfillment_status = 'FAILED') OR
    (state = 'PAYMENT_FAILED' AND payment_status = 'FAILED' AND fulfillment_status = 'BLOCKED') OR
    (state = 'PAYMENT_EXPIRED' AND payment_status = 'EXPIRED' AND fulfillment_status = 'BLOCKED') OR
    (state = 'CANCELLED' AND payment_status = 'CANCELLED' AND fulfillment_status = 'CANCELLED') OR
    (state IN ('REFUND_PENDING', 'REFUNDED') AND payment_status = state AND fulfillment_status IN ('BLOCKED', 'CANCELLED', 'FAILED', 'FULFILLED'))
  )
) STRICT;
-- statement-breakpoint
CREATE TABLE payments (
  id TEXT PRIMARY KEY NOT NULL CHECK(length(id) = 36),
  order_id TEXT NOT NULL,
  operation_key_hash TEXT NOT NULL CHECK(length(operation_key_hash) = 64),
  provider TEXT NOT NULL CHECK(length(provider) BETWEEN 1 AND 64),
  provider_reference TEXT CHECK(provider_reference IS NULL OR length(provider_reference) BETWEEN 1 AND 200),
  amount_minor INTEGER NOT NULL CHECK(amount_minor BETWEEN 0 AND 9007199254740991),
  currency TEXT NOT NULL,
  currency_exponent INTEGER NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('PENDING', 'CONFIRMED', 'FAILED', 'EXPIRED', 'CANCELLED', 'REFUND_PENDING', 'REFUNDED')),
  initiated_at TEXT NOT NULL,
  confirmed_at TEXT,
  failed_at TEXT,
  failure_code TEXT,
  UNIQUE(order_id, operation_key_hash),
  UNIQUE(provider, provider_reference),
  FOREIGN KEY(order_id, amount_minor, currency, currency_exponent) REFERENCES orders(id, amount_minor, currency, currency_exponent) ON DELETE RESTRICT,
  CHECK(status NOT IN ('CONFIRMED', 'REFUND_PENDING', 'REFUNDED') OR confirmed_at IS NOT NULL)
) STRICT;
-- statement-breakpoint
CREATE UNIQUE INDEX payments_one_live_attempt ON payments(order_id)
WHERE status IN ('PENDING', 'CONFIRMED', 'REFUND_PENDING', 'REFUNDED');
-- statement-breakpoint
CREATE TABLE fulfillments (
  id TEXT PRIMARY KEY NOT NULL CHECK(length(id) = 36),
  order_id TEXT NOT NULL UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
  type TEXT NOT NULL DEFAULT 'DIGITAL' CHECK(type IN ('DIGITAL', 'PHYSICAL', 'SERVICE')),
  status TEXT NOT NULL DEFAULT 'BLOCKED' CHECK(status IN ('BLOCKED', 'PENDING', 'IN_PROGRESS', 'FULFILLED', 'FAILED', 'CANCELLED')),
  delivery_reference TEXT NOT NULL,
  started_at TEXT,
  completed_at TEXT,
  failure_code TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK(status <> 'FULFILLED' OR completed_at IS NOT NULL)
) STRICT;
-- statement-breakpoint
CREATE TABLE transaction_events (
  id TEXT PRIMARY KEY NOT NULL CHECK(length(id) = 36),
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  kind TEXT NOT NULL CHECK(kind IN ('checkout.started', 'order.created', 'checkout.replayed', 'payment.initiated', 'payment.confirmed', 'payment.failed', 'payment.expired', 'order.cancelled', 'fulfillment.authorized', 'fulfillment.completed', 'fulfillment.failed', 'refund.pending', 'refund.completed')),
  dedup_key TEXT NOT NULL,
  from_state TEXT NOT NULL,
  to_state TEXT NOT NULL,
  correlation_id TEXT NOT NULL CHECK(length(correlation_id) = 36),
  request_id TEXT NOT NULL CHECK(length(request_id) = 36),
  is_duplicate INTEGER NOT NULL DEFAULT 0 CHECK(is_duplicate IN (0, 1)),
  created_at TEXT NOT NULL,
  UNIQUE(order_id, kind, dedup_key)
) STRICT;
-- statement-breakpoint
CREATE UNIQUE INDEX transaction_events_one_confirmation ON transaction_events(order_id) WHERE kind = 'payment.confirmed';
-- statement-breakpoint
CREATE INDEX orders_state_updated_idx ON orders(state, updated_at);
-- statement-breakpoint
CREATE INDEX payments_order_idx ON payments(order_id, initiated_at);
-- statement-breakpoint
CREATE INDEX transaction_events_order_idx ON transaction_events(order_id, created_at, id);
-- statement-breakpoint
CREATE TRIGGER order_matches_checkout BEFORE INSERT ON orders
WHEN NOT EXISTS (SELECT 1 FROM checkout_sessions c WHERE c.id = NEW.checkout_session_id
  AND c.offer_id = NEW.offer_id AND c.product_id = NEW.product_id AND c.product_version_id = NEW.product_version_id
  AND c.quantity = NEW.quantity AND c.unit_price_minor = NEW.unit_price_minor AND c.amount_minor = NEW.amount_minor
  AND c.currency = NEW.currency AND c.currency_exponent = NEW.currency_exponent
  AND c.product_name = NEW.product_name AND c.offer_name = NEW.offer_name AND c.version_label = NEW.version_label
  AND c.delivery_reference = NEW.delivery_reference AND c.source_channel = NEW.source_channel
  AND c.customer_reference IS NEW.customer_reference AND c.correlation_id = NEW.correlation_id
  AND c.created_at = NEW.created_at AND c.expires_at = NEW.expires_at)
BEGIN SELECT RAISE(ABORT, 'ORDER_CHECKOUT_MISMATCH'); END;
-- statement-breakpoint
CREATE TRIGGER checkout_snapshot_immutable BEFORE UPDATE OF
id, idempotency_key_hash, request_hash, offer_id, product_id, product_version_id,
quantity, unit_price_minor, amount_minor, currency, currency_exponent, product_name,
offer_name, version_label, delivery_reference, source_channel, customer_reference,
correlation_id, created_at, expires_at ON checkout_sessions
BEGIN SELECT RAISE(ABORT, 'IMMUTABLE_CHECKOUT_SNAPSHOT'); END;
-- statement-breakpoint
CREATE TRIGGER order_snapshot_immutable BEFORE UPDATE OF
id, transaction_reference, checkout_session_id, offer_id, product_id, product_version_id,
quantity, unit_price_minor, amount_minor, currency, currency_exponent, product_name,
offer_name, version_label, delivery_reference, source_channel, customer_reference,
correlation_id, created_at, expires_at ON orders
BEGIN SELECT RAISE(ABORT, 'IMMUTABLE_ORDER_SNAPSHOT'); END;
-- statement-breakpoint
CREATE TRIGGER referenced_version_immutable BEFORE UPDATE OF id, product_id, version, metadata_json ON product_versions
WHEN EXISTS (SELECT 1 FROM checkout_sessions WHERE product_version_id = OLD.id)
BEGIN SELECT RAISE(ABORT, 'IMMUTABLE_REFERENCED_VERSION'); END;
-- statement-breakpoint
CREATE TRIGGER transaction_event_no_update BEFORE UPDATE ON transaction_events
BEGIN SELECT RAISE(ABORT, 'APPEND_ONLY_EVENT'); END;
-- statement-breakpoint
CREATE TRIGGER transaction_event_no_delete BEFORE DELETE ON transaction_events
BEGIN SELECT RAISE(ABORT, 'APPEND_ONLY_EVENT'); END;
-- statement-breakpoint
CREATE TRIGGER order_transition_guard BEFORE UPDATE OF state ON orders
WHEN NEW.state <> OLD.state AND NOT (
 (OLD.state = 'CHECKOUT_STARTED' AND NEW.state IN ('PAYMENT_PENDING', 'PAYMENT_EXPIRED', 'CANCELLED')) OR
 (OLD.state = 'PAYMENT_PENDING' AND NEW.state IN ('PAYMENT_CONFIRMED', 'PAYMENT_FAILED', 'PAYMENT_EXPIRED', 'CANCELLED')) OR
 (OLD.state = 'PAYMENT_CONFIRMED' AND NEW.state IN ('FULFILLMENT_PENDING', 'REFUND_PENDING')) OR
 (OLD.state = 'FULFILLMENT_PENDING' AND NEW.state IN ('FULFILLED', 'FULFILLMENT_FAILED', 'REFUND_PENDING')) OR
 (OLD.state = 'FULFILLMENT_FAILED' AND NEW.state IN ('FULFILLMENT_PENDING', 'REFUND_PENDING')) OR
 (OLD.state = 'FULFILLED' AND NEW.state = 'REFUND_PENDING') OR
 (OLD.state = 'REFUND_PENDING' AND NEW.state = 'REFUNDED')
)
BEGIN SELECT RAISE(ABORT, 'INVALID_TRANSACTION_TRANSITION'); END;
-- statement-breakpoint
CREATE TRIGGER fulfillment_requires_payment_insert BEFORE INSERT ON fulfillments
WHEN NEW.status NOT IN ('BLOCKED', 'CANCELLED') AND NOT EXISTS (
 SELECT 1 FROM orders WHERE id = NEW.order_id AND payment_status = 'CONFIRMED'
)
BEGIN SELECT RAISE(ABORT, 'PAYMENT_NOT_CONFIRMED'); END;
-- statement-breakpoint
CREATE TRIGGER fulfillment_requires_payment_update BEFORE UPDATE OF status ON fulfillments
WHEN NEW.status NOT IN ('BLOCKED', 'CANCELLED') AND NOT EXISTS (
 SELECT 1 FROM orders WHERE id = NEW.order_id AND payment_status = 'CONFIRMED'
)
BEGIN SELECT RAISE(ABORT, 'PAYMENT_NOT_CONFIRMED'); END;
