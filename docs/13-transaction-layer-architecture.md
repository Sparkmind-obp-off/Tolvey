# 13 — Transaction Layer Architecture

## Purpose
The TOLVEY Transaction Layer is the execution layer between a canonical TOLVEY offer and a completed customer transaction.

TOLVEY remains the Product House Hub + Commerce House Hub. The transaction layer must not turn TOLVEY into a multi-vendor marketplace.

## Core principle
One canonical product/offer → many distribution channels → one normalized transaction model → one operational truth.

Direct TOLVEY checkout is one channel. External marketplaces, social-commerce surfaces, Link.id-style link commerce, affiliates, creators, and other verified channels are additional channels.

## Responsibilities
The transaction layer owns:
1. checkout session creation
2. payment-provider selection
3. payment initiation
4. payment status normalization
5. callback/webhook handling
6. order creation/update
7. idempotency
8. fulfillment handoff
9. customer-facing transaction status
10. transaction audit trail
11. reconciliation signals
12. analytics events

It does not own:
- product discovery as a marketplace
- seller onboarding
- seller commissions
- escrow
- third-party seller balances
- arbitrary payment-provider credentials in the frontend
- accounting as a replacement for a financial ledger/accounting system

## Transaction lifecycle
OFFER_READY → CHECKOUT_STARTED → PAYMENT_PENDING → PAYMENT_CONFIRMED → FULFILLMENT_PENDING → FULFILLED

Alternative terminal states:
PAYMENT_FAILED
PAYMENT_EXPIRED
CANCELLED
REFUND_PENDING
REFUNDED

The internal state is canonical. External providers and channels are adapters that map their statuses into this model.

## Canonical transaction entities
### CheckoutSession
- checkout_session_id
- offer_id
- product_id
- product_version_id
- quantity
- amount
- currency
- customer_reference
- source_channel
- campaign/source metadata
- payment_provider
- status
- created_at
- expires_at

### Order
- order_id
- checkout_session_id
- source_channel
- external_order_id
- customer_reference
- currency
- subtotal
- discount
- fees
- total
- payment_status
- fulfillment_status
- refund_status
- created_at
- updated_at

### Payment
- payment_id
- order_id
- provider
- provider_reference
- amount
- currency
- status
- method/channel
- initiated_at
- confirmed_at
- failure_code/reference
- raw_provider_reference (never raw secrets)

### Fulfillment
- fulfillment_id
- order_id
- type
- status
- delivery_reference
- delivered_at
- failure_reason

## Provider adapter boundary
Use:
Commerce Core → Payment Adapter → Provider

The core must never depend directly on Duitku-specific fields.

Example adapter contract:
- createPaymentIntent / initiateCheckout
- verifyCallback
- normalizeStatus
- getPaymentReference
- mapFailure
- optional: queryPaymentStatus

Duitku is the first provider implementation.

## Direct checkout vs external channel
### Direct TOLVEY checkout
Customer:
TOLVEY product page → checkout → Duitku POP → payment → TOLVEY callback/status → order → fulfillment

### External channel
Customer:
External channel → external checkout/payment → channel order signal → TOLVEY order normalization → fulfillment/analytics

If an external channel owns the checkout, TOLVEY must not falsely represent its own payment flow as the provider of record.

## Idempotency
Every payment initiation and callback flow must tolerate duplicate requests/events.

Required controls:
- unique internal order ID
- unique provider reference where available
- idempotency key for retryable initiation
- callback/event deduplication
- atomic status transition rules
- no duplicate fulfillment
- no duplicate revenue event

A payment callback must never be trusted merely because a browser redirected to a success URL.

## Security
- Merchant/API secrets stay server-side.
- Never expose Duitku API keys in client JavaScript.
- Never commit secrets.
- Validate and authenticate provider callbacks according to current Duitku documentation.
- Validate amount, merchant/order reference, and expected transaction state before marking an order paid.
- Log safe identifiers, not credentials or sensitive payment data.
- Separate sandbox/test and production credentials.
- Rate-limit public transaction endpoints.
- Preserve an audit trail for status changes.

## Reconciliation
Distinguish:
- customer-facing redirect/success
- provider callback
- internal payment status
- fulfillment completion

The strongest internal confirmation is a verified provider transaction signal, not a browser-side success screen.

## Failure handling
If payment is pending:
- keep order/payment pending
- do not fulfill unless business rules explicitly allow it

If payment fails/expired:
- preserve the order
- expose retry where appropriate
- do not create duplicate order records unnecessarily

If callback is duplicated:
- return safely without repeating side effects

If fulfillment fails after payment:
- payment remains confirmed
- fulfillment becomes failed/pending
- operator is alerted
- customer support path remains available

## Observability
Emit events such as:
- checkout.started
- payment.initiated
- payment.pending
- payment.confirmed
- payment.failed
- payment.expired
- order.created
- order.updated
- fulfillment.started
- fulfillment.completed
- fulfillment.failed
- refund.created
- refund.completed

Every event should carry correlation IDs and safe references.

## Implemented Phase 2 checkpoint — 2026-09-30

Status: **Implemented + locally Verified; Phase 2 IN PROGRESS**, not end-to-end commerce.

Migration 0002 adds `checkout_sessions`, `orders`, `payments`, `fulfillments`, and append-only `transaction_events`. Payment and fulfillment execution are not implemented by the presence of these tables.

Implemented flow:
`active canonical Offer/Product/ProductVersion → immutable CheckoutSession → pending Order → BLOCKED Fulfillment + creation audit`.

- One D1 batch inserts checkout, order, blocked fulfillment and two creation events atomically. No payment row or confirmation/revenue event is manufactured.
- Monetary values are selected/calculated from canonical records at SQL write time. Input is offer UUID, quantity 1–100, source label, optional opaque customer UUID; client totals/currency/status/private delivery fields are rejected.
- Session lifetime is fixed at 30 minutes. Expiration timestamp is durable and cannot be extended by retry. Automatic expiration/status reconciliation remains to be implemented; returning an existing snapshot is not permission to initiate payment after expiry.
- UUID identities and stable `TV-<UUID hex>` transaction reference precede provider initiation. Snapshots preserve price, currency/exponent, quantity, names, version label and private delivery reference even if catalog price/name later changes.
- Referenced version identity/content is immutable after first checkout; lifecycle archival remains allowed. Composite relationships prevent mismatched offer/product/version. Use a new offer to change the version once the old offer is referenced.
- `checkout.create:v1` operation scope plus SHA-256 idempotency key/request hashes; same key/meaning returns the same order; changed meaning returns 409. Keys are scoped to a single trusted internal service, not customer or marketplace tenants.
- Concurrent checkout creation uses uniqueness and `ON CONFLICT DO NOTHING`; the winning snapshot is retrieved after commit. Failure anywhere in the batch rolls all creation side effects back.
- Events record state, original correlation ID, current request ID and duplicate marker. Replays are deduplicated by request ID; creation events are not repeated. Audit is not a financial ledger.
- Schema defense in depth: one order/session and fulfillment/order, one live payment attempt/order, unique provider/reference, payment/order money composite FK, one payment.confirmed event/order, immutable snapshots, append-only events, legal order-state graph/status checks, and a barrier against unpaid fulfillment.
- `assertTransition` and `PaymentAdapter`/`VerifiedPaymentSignal` declare provider-neutral contracts. No provider implementation, signal-ingestion service, or arbitrary state-transition API exists yet. SQL constraints do not verify a real provider signal.

Verification: 40 checkpoint tests on real local D1 and compiled workerd plus the unchanged 69 Phase 1 tests passed (109 total). Includes 12 concurrent identical requests, concurrent conflicting meaning, injected batch failure/retry, immutable snapshots, integer-money boundaries, FK checks, schema dedup constraints, protected API failures, and client-money rejection. Local Wrangler creation/replay/status reads were observed with a temporary ignored service credential; payments remained PENDING and fulfillment BLOCKED.

Remaining required Phase 2 gate: persistent payment initiation/verified-signal handling, atomic cross-entity transitions, expiration/cancellation, fulfillment authorization/retry/completion, refund operations where required, full test-provider lifecycle, duplicate callback/revenue/concurrent-transition tests, and release/deployment identity handling. No actual payment/delivery is claimed and no real provider was connected.

## Architecture rule
TOLVEY owns the canonical transaction model.
Duitku owns payment execution.
External commerce platforms own their own channel checkout where applicable.
The adapter layer keeps these responsibilities separate.
