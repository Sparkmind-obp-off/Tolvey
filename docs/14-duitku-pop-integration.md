# 14 — Duitku POP Integration Architecture

## Purpose
Duitku POP is TOLVEY's first direct-checkout payment integration.

This document defines how Duitku POP fits into the TOLVEY Commerce Hub without making TOLVEY dependent on Duitku-specific implementation details.

## Official integration reference
Duitku documents Duitku POP as an integration option where the payment-method selection/payment page is provided by Duitku. Duitku documents both popup and redirect options.

Primary references:
- https://docs.duitku.com/payment-gateway/api-browser/
- https://docs.duitku.com/payment-gateway/overview/
- https://www.duitku.com/duitku-pop-solusi-integrasi-pembayaran-bisnis/

Implementation must always be checked against the current official Duitku documentation before production release.

## Role in TOLVEY
Duitku POP is:
Payment Provider Adapter → Direct Checkout

It is not:
- the TOLVEY order database
- the product catalog
- the fulfillment system
- the customer database
- the analytics source of truth
- the external marketplace layer

## Intended flow
TOLVEY Product/Offer
→ TOLVEY Checkout
→ TOLVEY server creates/initializes transaction
→ Duitku POP
→ customer selects payment method
→ Duitku payment processing
→ Duitku callback/status
→ TOLVEY verifies and normalizes status
→ Order.payment_status = CONFIRMED
→ Fulfillment
→ Analytics

The exact request, callback, signature/hash, parameters, and JavaScript initialization must follow the current official Duitku POP API specification.

## Frontend boundary
Duitku POP may provide a popup or redirect payment experience.

Frontend code may contain only values explicitly intended for browser use by Duitku's current integration specification.

Never place:
- Merchant API secret
- private credentials
- server-only verification material
- internal administrative tokens
into public client code.

The browser success/redirect state is not sufficient evidence to mark an order as paid.

## Backend boundary
The backend owns:
1. canonical order creation
2. amount calculation
3. product/offer validation
4. transaction reference generation
5. Duitku initialization request where required
6. callback verification
7. status normalization
8. idempotency
9. order persistence
10. fulfillment authorization

All monetary values must be calculated from trusted server-side product/offer data.
Never trust client-submitted totals.

## Environment separation
### Sandbox
- Duitku sandbox/test credentials
- test endpoints/configuration
- test products/orders
- explicit test mode

### Production
- production Merchant Code/project credentials
- production endpoint/configuration
- production monitoring
- production transaction records

Credentials must be stored in the production secret manager/environment, never in Git.

## Configuration abstraction
Use a provider configuration such as:
- PAYMENT_PROVIDER=duitku
- DUITKU_MERCHANT_CODE
- DUITKU_API_KEY or current provider secret name
- DUITKU_ENV=sandbox|production
- callback/return URLs as required

Actual variable names may change during implementation, but secrets must remain server-side.

## Provider adapter contract
TOLVEY should expose an internal interface approximately equivalent to:
- createCheckout(transaction)
- handleCallback(request)
- normalizePaymentStatus(providerPayload)
- verifyPayment(providerPayload)
- getProviderReference(providerPayload)

Do not spread Duitku-specific request/response fields throughout the application.

## Callback handling
Callback handling must:
1. parse request safely
2. validate expected provider fields
3. verify authenticity using the current Duitku mechanism
4. locate the internal order/transaction
5. validate amount and expected merchant/project context
6. apply an allowed state transition
7. deduplicate repeated callbacks
8. record the provider reference/status
9. emit the corresponding internal event
10. return the provider-required response

A callback must not trigger fulfillment more than once.

## Return URL vs callback
Treat these as different concepts:
- Return/redirect: customer/browser experience.
- Callback/notification: machine-to-machine payment confirmation.

The return page can show processing, paid, failed, or another safe state based on internal data. It must not manufacture a successful payment state from browser navigation alone.

## Payment status normalization
Provider-specific statuses must map to a small TOLVEY state machine:
- PENDING
- CONFIRMED
- FAILED
- EXPIRED
- CANCELLED
- REFUND_PENDING
- REFUNDED

Unknown provider statuses must fail safely and be visible to the operator rather than silently becoming CONFIRMED.

## Testing requirements
Before production:
1. sandbox checkout opens correctly
2. valid test payment reaches expected callback
3. valid callback changes internal payment state
4. duplicate callback is harmless
5. invalid callback is rejected
6. amount mismatch is rejected
7. unknown order reference is handled safely
8. browser success without verified callback does not mark payment confirmed
9. failed/expired payment does not fulfill
10. confirmed payment triggers fulfillment exactly once
11. secrets are absent from client bundle/logs
12. production configuration cannot accidentally point to sandbox, and vice versa

## Production gate
Duitku POP integration is not complete merely because the popup opens.

It is complete only when:
Offer → Checkout → Duitku POP → Verified Payment Signal → Internal Order → Fulfillment → Customer Outcome → Analytics

## Change policy
Duitku API behavior can change. Before release, implementation must re-check the official Duitku documentation and current account/project configuration.

Do not hard-code undocumented assumptions.
