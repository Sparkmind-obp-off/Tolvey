# TOLVEY — Data & D1 Architecture

## 1. Data principle
D1 is the canonical structured operational store for TOLVEY's application state.

It is not automatically the complete accounting ledger, analytics warehouse, asset store, or external-provider database.

## 2. Canonical hierarchy
Product
→ ProductVersion
→ Offer
→ CheckoutSession
→ Order
→ Payment
→ Fulfillment.

Additional operational entities:
CustomerReference, Channel, ChannelListing, Event, Asset.

Only entities required by the current phase should be persisted.

## 3. Phase 1 tables
### products
Canonical product identity.

### product_versions
Version/revision of a product.

### offers
Commercial offer and authoritative sale price.

## 4. Phase 2 checkpoint schema — implemented, locally verified

Immutable ordered migration `0002_transaction_core.sql` adds:
- `checkout_sessions`: scoped idempotency-key hash + request hash, canonical FKs, authoritative immutable purchase snapshot, quantity, explicit money/currency/exponent, source label, nullable opaque customer UUID, correlation ID, fixed creation/expiry, lifecycle.
- `orders`: unique checkout reference, stable provider-neutral reference, immutable purchase snapshot, lifecycle/payment/fulfillment statuses, timestamps and safe failure-code slot.
- `payments`: provider-neutral attempt/reference, authoritative money FK to order, normalized status/timestamps/failure code, unique operation/order and provider/reference, one live/confirmed attempt per order. No raw payload stored.
- `fulfillments`: one/order, type and private delivery reference, status/timestamps/failure code. Creation placeholder is DIGITAL/BLOCKED, not a delivery execution or Layer 2 service workflow.
- `transaction_events`: append-only audit, kind/dedup/state/correlation/request/duplicate/timestamp. Unique business-event constraints are not a separate financial ledger.

CHECK/FK/unique/index/trigger constraints protect matched offer/product/version, money bounds, snapshot consistency, referenced version content, immutable order/session snapshots, legal order-state/status combinations, unpaid fulfillment, and event append-only/dedup. Offer price/name may change later without rewriting a purchase; referenced offer version cannot be repointed. ProductVersion archival is allowed, identity/content edits after checkout are not.

Creation uses one D1 batch and SQL `INSERT ... SELECT` from active parents at write time. Quantity 1–100, exact integer total, BigInt-derived safe bound. The key/request fingerprints live in the checkout record; a separate idempotency table is not required for this operation. Same-key concurrent losers retrieve the winner; mismatched request hash returns conflict. No payment record is generated just to claim architecture completion.

Verified fresh migrations and upgrade over existing Phase 1 fixture catalog in real workerd D1; Wrangler local upgrade and rerun; FK check empty. **Migration 0002 has NOT been applied remotely.** Existing migration 0001 is unchanged. Explicit statement-breakpoint comments delimit complete trigger statements in the test harness; production SQL still runs through Wrangler migration tooling.

Full internal local/test orchestration is now implemented (see below); schema constraints still do not authenticate callbacks or deliver products. Customer UUID is opaque/non-PII; contact/customer identity/consent/retention is outside Phase 2. No destructive transaction rollback/delete workflow.

### Additive migration 0003 — implemented and locally verified

`orders.revision` defaults to zero for existing checkpoint rows. Immutable transaction_operations store operation/key/request hashes, optional globally unique signal identity, expected revision, from/to states, payment FK, request ID/time; unique `(order_id, expected_revision)` prevents stale concurrent writes. Deferred payment FK supports initiation in the same batch. Immutable transaction_operation_keys preserve duplicate-signal key aliases; append-only transaction_operation_replays record duplicate request IDs/times without repeating business events.

Additional triggers freeze payment identity/expected money and existing confirmed_at, enforce payment/fulfillment transitions, freeze fulfillment identity and prevent terminal checkout reopening. 0001/0002 were not changed. All new lifecycle entity/event writes are gated by the newly inserted operation UUID in the same batch, using revision/state CAS. Immutable original receipts are returned; current state is read separately.

Fresh Wrangler 0001→0002→0003 and local upgrade with an existing order passed; reruns no-op. Workerd upgrade tests preserve an existing checkpoint snapshot and then initiate its payment. FK checks empty. D1 API denied integrity_check (SQLITE_AUTH); offline read-only integrity_check on both local SQLite databases returned ok. No migration was applied remotely. Eight injected audit failures proved whole-batch rollback then same-key retry. 150 tests passed. This is operational simulation evidence only, not a provider/delivery ledger.

## 5. Integrity
Use:
- foreign keys
- composite relationships where needed
- unique constraints
- CHECK constraints
- explicit lifecycle states
- deterministic timestamps
- safe integer money representation

## 6. Money
Never use floating-point database money.

Use:
price_minor + currency + currency_exponent

The Offer is the authoritative sale-price source.

## 7. JSON
Use JSON metadata only for bounded, non-relational metadata where it does not weaken core integrity.

Important queryable business fields should be first-class columns.

## 8. Migrations
- additive by default
- reviewed before remote application
- tested on fresh database
- tested on representative existing schema
- no destructive rollback assumed
- transaction history must never be deleted as a rollback strategy

## 9. Environments
Local/test must use isolated databases.

Preview currently fails closed without D1 because remote staging quota is unavailable.

Production uses the dedicated TOLVEY production D1 binding.

Never use production as a test fixture database.

## 10. Data retention
Retention rules must be defined by data class before collecting customer/payment information.

Separate:
- operational transaction records
- customer-provided data
- provider references
- audit events
- analytics aggregates
- private assets

Collect the minimum data needed.

## 11. Backup/recovery
Before production commerce:
- define D1 recovery/export strategy
- define migration recovery
- define application rollback
- preserve transaction/audit records
- rehearse recovery on non-production data

## Phase 3 provider metadata — migration 0004

Additive `0004_duitku_pop.sql`, existing 0001–0003 unchanged:
- `duitku_pop_invoices`: unique canonical order/merchantOrderId mapping, sandbox environment, project/request SHA256 hashes, ownership UUID, RESERVED/READY, unique provider reference, trusted payment URL and timestamp. No duplicate canonical money, raw credentials or plaintext email.
- `duitku_pop_notifications`: append-only authenticated outcome audit with optional order FK, normalized payload hash, ACCEPTED/REPLAYED/REJECTED, safe code/request/time. No raw signature/body/PII/card metadata. Invalid unauthenticated requests use sanitized HTTP outcome logs instead.

Reservation precedes the external invoice side effect and blocks duplicate outbound attempts. READY receipt is immutable and lets canonical attachment recover with the existing Phase 2 operation key. A RESERVED ambiguous external outcome is never blindly reset/retried/deleted; provider reconciliation is required. No queue/job or automatic recovery is claimed.

Canonical state/events/operation receipt remain atomic in the existing D1 batch. Provider notification audit is supplemental: audit failure after canonical commit returns failure to the provider; replay later records the outcome without another confirmation. Provider tables are not financial ledgers/revenue aggregates.

Fresh/upgrade local Wrangler migrations passed, prior canonical records checksum unchanged, rerun no-op, FK empty and local read-only SQLite integrity ok. No remote schema operation. POP contract tests use isolated D1/workerd, not production. Customer contact retention/customer accounts remain later scope.
