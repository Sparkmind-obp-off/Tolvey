-- Provider-only sandbox metadata; canonical money stays in orders/payments.
CREATE TABLE duitku_pop_invoices (
  order_id TEXT PRIMARY KEY NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  merchant_order_id TEXT NOT NULL UNIQUE CHECK(merchant_order_id = order_id),
  environment TEXT NOT NULL CHECK(environment = 'sandbox'),
  project_hash TEXT NOT NULL CHECK(length(project_hash) = 64),
  request_hash TEXT NOT NULL CHECK(length(request_hash) = 64),
  owner_id TEXT NOT NULL CHECK(length(owner_id) = 36),
  status TEXT NOT NULL CHECK(status IN ('RESERVED','READY')),
  provider_reference TEXT UNIQUE,
  payment_url TEXT,
  created_at TEXT NOT NULL,
  CHECK((status = 'RESERVED' AND provider_reference IS NULL AND payment_url IS NULL) OR
        (status = 'READY' AND provider_reference IS NOT NULL AND payment_url IS NOT NULL))
) STRICT;
-- statement-breakpoint
CREATE TRIGGER duitku_invoice_identity BEFORE UPDATE OF order_id,merchant_order_id,environment,project_hash,request_hash,owner_id,created_at ON duitku_pop_invoices
BEGIN SELECT RAISE(ABORT,'IMMUTABLE_PROVIDER_IDENTITY'); END;
-- statement-breakpoint
CREATE TRIGGER duitku_invoice_ready BEFORE UPDATE ON duitku_pop_invoices WHEN OLD.status='READY'
BEGIN SELECT RAISE(ABORT,'IMMUTABLE_PROVIDER_RECEIPT'); END;
-- statement-breakpoint
CREATE TRIGGER duitku_invoice_no_delete BEFORE DELETE ON duitku_pop_invoices
BEGIN SELECT RAISE(ABORT,'PRESERVE_PROVIDER_RECEIPT'); END;
-- statement-breakpoint
CREATE TABLE duitku_pop_notifications (
  id TEXT PRIMARY KEY NOT NULL CHECK(length(id)=36),
  order_id TEXT REFERENCES orders(id) ON DELETE RESTRICT,
  payload_hash TEXT NOT NULL CHECK(length(payload_hash)=64),
  outcome TEXT NOT NULL CHECK(outcome IN ('ACCEPTED','REPLAYED','REJECTED')),
  code TEXT NOT NULL CHECK(length(code) BETWEEN 1 AND 80),
  request_id TEXT NOT NULL CHECK(length(request_id)=36),
  created_at TEXT NOT NULL
) STRICT;
-- statement-breakpoint
CREATE INDEX duitku_notifications_order ON duitku_pop_notifications(order_id,created_at);
-- statement-breakpoint
CREATE TRIGGER duitku_notification_no_update BEFORE UPDATE ON duitku_pop_notifications
BEGIN SELECT RAISE(ABORT,'APPEND_ONLY_PROVIDER_AUDIT'); END;
-- statement-breakpoint
CREATE TRIGGER duitku_notification_no_delete BEFORE DELETE ON duitku_pop_notifications
BEGIN SELECT RAISE(ABORT,'APPEND_ONLY_PROVIDER_AUDIT'); END;
