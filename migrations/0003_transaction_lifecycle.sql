-- Additive lifecycle CAS and immutable operation receipts. No provider execution.
ALTER TABLE orders ADD COLUMN revision INTEGER NOT NULL DEFAULT 0 CHECK(revision >= 0);
-- statement-breakpoint
CREATE TABLE transaction_operations (
  id TEXT PRIMARY KEY NOT NULL CHECK(length(id) = 36),
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  operation TEXT NOT NULL CHECK(operation IN ('payment.initiate','payment.signal','order.expire','order.cancel','fulfillment.authorize','fulfillment.complete','fulfillment.fail','refund.request')),
  key_hash TEXT NOT NULL UNIQUE CHECK(length(key_hash) = 64),
  request_hash TEXT NOT NULL CHECK(length(request_hash) = 64),
  signal_identity TEXT UNIQUE CHECK(signal_identity IS NULL OR length(signal_identity) = 64),
  expected_revision INTEGER NOT NULL CHECK(expected_revision >= 0),
  from_state TEXT NOT NULL,
  to_state TEXT NOT NULL,
  payment_id TEXT REFERENCES payments(id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
  request_id TEXT NOT NULL CHECK(length(request_id) = 36),
  created_at TEXT NOT NULL,
  UNIQUE(order_id, expected_revision)
) STRICT;
-- statement-breakpoint
CREATE TABLE transaction_operation_keys (
  key_hash TEXT PRIMARY KEY NOT NULL CHECK(length(key_hash) = 64),
  operation_id TEXT NOT NULL REFERENCES transaction_operations(id) ON DELETE RESTRICT
) STRICT;
-- statement-breakpoint
CREATE TRIGGER transaction_key_no_update BEFORE UPDATE ON transaction_operation_keys
BEGIN SELECT RAISE(ABORT, 'IMMUTABLE_OPERATION_KEY'); END;
-- statement-breakpoint
CREATE TRIGGER transaction_key_no_delete BEFORE DELETE ON transaction_operation_keys
BEGIN SELECT RAISE(ABORT, 'IMMUTABLE_OPERATION_KEY'); END;
-- statement-breakpoint
CREATE TABLE transaction_operation_replays (
  operation_id TEXT NOT NULL REFERENCES transaction_operations(id) ON DELETE RESTRICT,
  request_id TEXT NOT NULL CHECK(length(request_id) = 36),
  created_at TEXT NOT NULL,
  PRIMARY KEY(operation_id, request_id)
) STRICT;
-- statement-breakpoint
CREATE TRIGGER transaction_operation_no_update BEFORE UPDATE ON transaction_operations
BEGIN SELECT RAISE(ABORT, 'IMMUTABLE_OPERATION'); END;
-- statement-breakpoint
CREATE TRIGGER transaction_operation_no_delete BEFORE DELETE ON transaction_operations
BEGIN SELECT RAISE(ABORT, 'IMMUTABLE_OPERATION'); END;
-- statement-breakpoint
CREATE TRIGGER transaction_replay_no_update BEFORE UPDATE ON transaction_operation_replays
BEGIN SELECT RAISE(ABORT, 'APPEND_ONLY_REPLAY'); END;
-- statement-breakpoint
CREATE TRIGGER transaction_replay_no_delete BEFORE DELETE ON transaction_operation_replays
BEGIN SELECT RAISE(ABORT, 'APPEND_ONLY_REPLAY'); END;
-- statement-breakpoint
CREATE TRIGGER payment_identity_immutable BEFORE UPDATE OF id, order_id, operation_key_hash, provider, provider_reference, amount_minor, currency, currency_exponent, initiated_at ON payments
BEGIN SELECT RAISE(ABORT, 'IMMUTABLE_PAYMENT_IDENTITY'); END;
-- statement-breakpoint
CREATE TRIGGER payment_confirmation_immutable BEFORE UPDATE OF confirmed_at ON payments
WHEN OLD.confirmed_at IS NOT NULL AND NEW.confirmed_at IS NOT OLD.confirmed_at
BEGIN SELECT RAISE(ABORT, 'IMMUTABLE_CONFIRMATION'); END;
-- statement-breakpoint
CREATE TRIGGER payment_transition_guard BEFORE UPDATE OF status ON payments
WHEN NEW.status <> OLD.status AND NOT (
  (OLD.status = 'PENDING' AND NEW.status IN ('CONFIRMED','FAILED','EXPIRED','CANCELLED')) OR
  (OLD.status = 'CONFIRMED' AND NEW.status = 'REFUND_PENDING') OR
  (OLD.status = 'REFUND_PENDING' AND NEW.status = 'REFUNDED')
)
BEGIN SELECT RAISE(ABORT, 'INVALID_PAYMENT_TRANSITION'); END;
-- statement-breakpoint
CREATE TRIGGER checkout_transition_guard BEFORE UPDATE OF status ON checkout_sessions
WHEN NEW.status <> OLD.status AND OLD.status <> 'CHECKOUT_STARTED'
BEGIN SELECT RAISE(ABORT, 'TERMINAL_CHECKOUT'); END;
-- statement-breakpoint
CREATE TRIGGER fulfillment_identity_immutable BEFORE UPDATE OF id, order_id, type, delivery_reference, created_at ON fulfillments
BEGIN SELECT RAISE(ABORT, 'IMMUTABLE_FULFILLMENT_IDENTITY'); END;
-- statement-breakpoint
CREATE TRIGGER fulfillment_transition_guard BEFORE UPDATE OF status ON fulfillments
WHEN NEW.status <> OLD.status AND NOT (
 (OLD.status = 'BLOCKED' AND NEW.status IN ('PENDING','CANCELLED')) OR
 (OLD.status = 'PENDING' AND NEW.status IN ('IN_PROGRESS','FULFILLED','FAILED','CANCELLED')) OR
 (OLD.status = 'IN_PROGRESS' AND NEW.status IN ('FULFILLED','FAILED','CANCELLED')) OR
 (OLD.status = 'FAILED' AND NEW.status IN ('PENDING','CANCELLED'))
)
BEGIN SELECT RAISE(ABORT, 'INVALID_FULFILLMENT_TRANSITION'); END;
