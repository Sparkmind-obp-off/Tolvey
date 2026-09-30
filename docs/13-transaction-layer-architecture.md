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

## Implemented Phase 2 lifecycle — 2026-09-30

**Implemented + locally Verified; Phase 2 COMPLETE in the latest local/test scope.** Git delivery is evidenced in the final session report. Production remains foundation-only. No customer transaction is inferred.

Migrations 0002 and additive 0003 persist CheckoutSession/Order/Payment/Fulfillment, events, revision and immutable operation/key/replay ledgers. Canonical active offer data produces immutable purchase snapshots in one creation batch, including a BLOCKED fulfillment and no payment. Version content and purchase/payment identity are immutable.

`createSimulationCore(db, environment)` provides internal local/test-only orchestration. No HTTP mutation route calls it; the production Hono bundle excludes it. Trusted environment is not customer input. A TypeScript signal shape does not authenticate a provider. Future adapters need a separately reviewed verified gateway; Phase 2 does not implement one.

Implemented sequence: OFFER_READY → CHECKOUT_STARTED → PAYMENT_PENDING → PAYMENT_CONFIRMED → FULFILLMENT_PENDING → FULFILLED. Failure, expiry, cancellation and fulfillment retry are implemented; REFUND_PENDING is request-only, with no REFUNDED service.

- Initiation stores a durable attempt/reference and SQL-copies canonical integer money/currency/exponent from the order. Customer money/status are not accepted.
- CONFIRMED/FAILED internal signals must match provider, payment reference, transaction reference and exact expected money. Pending payable order/payment and unexpired deadline required. Signal provider/event identity and normalized request hash detect replay/conflict; new events after terminal confirmation are rejected.
- Each batch inserts an operation receipt conditional on the order revision/state; all entity/event writes require its newly generated ownership UUID. The receipt reserves one operation per revision. CAS loser cannot run its side effects. Audit failure rolls back the entire batch; transient failure may retry with the same key.
- Idempotency keys are operation-scoped SHA-256 hashes, payloads are canonicalized. Additional retry keys for duplicate event identity become immutable aliases, so later changed meaning cannot reuse them. Replays are separately append-only and keyed by request ID; events do not repeat.
- Expiry lifetime is 30 minutes. Explicit expiry/cancel synchronizes checkout/order/pending payment. Pending fulfillment remains BLOCKED on expiry or becomes CANCELLED on cancellation. No scheduled worker/sweep exists; payment entry always checks expiry even if no sweep ran. Failed payment closes checkout as CANCELLED while preserving PAYMENT_FAILED/FAILED/BLOCKED truth.
- Fulfillment authorization requires confirmed payment. Failure preserves confirmation; retry uses a new authorization key and the same fulfillment row. Replaying an older authorization cannot reopen the failure. Completion is local simulated orchestration evidence, not actual delivery.
- Refund request sets order/payment REFUND_PENDING, preserves money/provider/reference/confirmed_at, cancels pending fulfillment and preserves existing FULFILLED/FAILED history. Duplicate requests replay. No provider call, refund-completed event or assertion of money returned.

Receipts record original from/to states, expected revision, payment identity, timestamp and request context; current state must be read separately. Different competing commands may return CONCURRENT_TRANSITION (409); re-read current truth before retrying. Matching retries can return an older receipt without changing current truth.

Verified: 150 tests, including 41 new lifecycle tests on real D1 and a separately bundled in-memory workerd lifecycle harness. Covers full happy path, mismatches, terminal and malformed signals, 12 identical concurrent initiations/confirmations, conflicting meanings, unique reference races, cancellation/refund/fulfillment races, eight injected audit-fault rollback/retry paths, immutability, fresh and existing-record upgrades. Events are audit, not a financial ledger or measured revenue.

Remaining outside Phase 2: provider authenticity/merchant verification, callbacks, actual payment/delivery/refund, public customer UX/access/rate limits, reconciliation/recovery and deliberate remote release. No Phase 3 implementation.

## Architecture rule
TOLVEY owns the canonical transaction model.
Duitku owns payment execution.
External commerce platforms own their own channel checkout where applicable.
The adapter layer keeps these responsibilities separate.
