# TOLVEY — Integration Architecture

## 1. Integration principle
External systems are adapters, not sources of TOLVEY's canonical business model.

Canonical internal model → adapter → external system.

## 2. Integration categories
### Payment
First provider: Duitku POP.

### Distribution
Marketplaces, social commerce, affiliate/creator channels, link-commerce surfaces.

### Delivery
Private digital asset delivery or other fulfillment providers when required.

### Communication
Email, WhatsApp, or other customer communication only where a real operational need and appropriate consent exist.

## 3. Adapter contract
An adapter should:
- translate internal request to provider request
- authenticate using server-side credentials
- verify provider response/callback
- normalize external statuses
- preserve external reference IDs
- expose safe errors
- tolerate retries

Provider-specific fields should not spread through domain entities.

## 4. Payment boundary
Commerce Core → Payment Adapter → Provider.

Duitku is Phase 3, not Phase 2.

The browser return/success page is never sufficient to mark a payment confirmed.

## 5. Distribution boundary
TOLVEY canonical product/offer → Channel Adapter → external listing/link/order signal.

External channel data is normalized back into TOLVEY records where operationally useful.

## 6. Webhooks/callbacks
All provider callbacks must:
- be parsed safely
- be authenticated/verified according to provider documentation
- validate expected order/reference/amount context
- be idempotent
- produce an audit signal
- avoid duplicate side effects

## 7. Credentials
Credentials belong in approved server-side secret storage.

Never:
- commit credentials
- put secrets in frontend bundles
- log raw provider credentials
- reuse production credentials in tests

## 8. Failure policy
Unknown external status → safe non-confirmed state + observable operator signal.

Provider outage → preserve internal pending state; do not invent success.

Duplicate event → safe no-op/idempotent response.

## 9. Integration readiness
Every integration must have:
- owner
- purpose
- contract
- environment separation
- secret boundary
- retry/idempotency behavior
- test strategy
- rollback/removal plan

## 10. Current integrations
Phase 1: Cloudflare Pages/Workers + D1 foundation.

Phase 2 checkpoint adds a provider-neutral TypeScript `PaymentAdapter` contract (`initiate`, `verifyNotification`) and normalized `VerifiedPaymentSignal` type. There is no implementation or runtime provider call, and no callback HTTP route. Later core processing must still validate expected provider/reference/amount and deduplicate authenticated signals before changing financial truth.

Internal local/test provider-neutral initiation/signal/fulfillment/refund-request orchestration is now implemented in transaction-lifecycle.ts and verified in a compiled in-memory workerd harness (150 total tests). Production application does not import it. Simulation rejects staging/production. It checks exact expected money/reference/expiry and deduplicates signals; it does NOT authenticate a real provider. Type/interface naming is never proof of authentication.

No provider calls, callbacks, Duitku, real payment, actual delivery or actual refund exist. Future adapter/gateway must verify provider/merchant authenticity before calling equivalent core orchestration; do not bypass production restrictions by passing a fake local/test environment. Refund completion remains unexposed. External side-effect idempotency/reconciliation belongs to the future adapter, not a claim of exactly-once delivery by the internal simulation.
