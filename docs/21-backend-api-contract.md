# TOLVEY — Backend & API Contract

## 1. API role
The Hono application is the controlled application boundary between clients, domain logic, D1, and external adapters.

## 2. API principles
- validate inputs at the boundary
- use stable resource identifiers
- return deterministic JSON contracts
- hide private fields
- use server-side money calculations
- use request/correlation IDs
- generic public errors
- explicit HTTP methods
- idempotency for retryable transaction operations

## 3. Current foundation endpoints
- GET /health
- GET /ready
- GET /api/products
- GET /api/products/:id
- GET /api/offers
- GET /api/offers/:id

Phase 1 public catalog mutations still return 405. Phase 2 adds only the protected non-production checkpoint route described below; `/api/checkout`, `/api/payments`, and public admin APIs remain absent.

## 4. Implemented transaction checkpoint API (non-production)

Status: locally verified, Phase 2 in progress. Not a customer checkout API.

Authorization/configuration: `DB`, explicit non-production APP_ENV, `TRANSACTION_CORE_ENABLED=true`, and random private `TRANSACTION_CORE_TOKEN` (32–256 characters). Bearer credential is server-side only. One internal service principal may read all checkpoint records; no customer/tenant authorization is claimed. Production is rejected even with the flag/token, and default configuration is disabled. No public exposure before rate-limit/access/full-lifecycle review.

- POST `/api/transaction-core/checkouts`: bounded 2048-byte application/json; only `offer_id` UUIDv4, integer `quantity` 1–100, `source_channel` (1–64 lowercase letters/digits/`._-`, begins alphanumeric), optional opaque UUID `customer_reference`. Reject unknown fields, including client amount/currency/status. Customer contact/PII is not accepted.
- Header `Idempotency-Key`: 16–128 ASCII letters/digits/`._:-`; raw key is never persisted/logged/returned. Operation scope is `checkout.create:v1` for the single internal service principal.
- 201 `{ data: { checkout, order, replayed: false } }` on creation; 200 with identical snapshots and `replayed: true` on matching retry; 409 `IDEMPOTENCY_CONFLICT` for reused key with changed meaning. Checkout and order are created together, not via a second independently retryable mutation.
- GET `/api/transaction-core/checkouts/:id`; GET `/api/transaction-core/orders/:id`: protected snapshots/status; malformed UUID 400, nonexistent 404. Private delivery/customer reference, key/hash and version metadata are excluded from DTOs.
- 503 `TRANSACTION_CORE_UNAVAILABLE` when disabled/incomplete/production; 401 `UNAUTHORIZED`; malformed/body/content/type/key input 400; unavailable offer 404; oversized body 413; generic unexpected error 500. Error shape `{ error, message, request_id }`, no SQL/provider/credential details.
- `/ready` retains default foundation behavior and adds transaction-schema/config probes when the flag is true.
- GET/HEAD/OPTIONS conventions stay intact; only the exact checkpoint create POST bypasses the global mutation barrier. Other mutation paths still return 405. No payment-confirmation/fulfillment/arbitrary transition mutation route exists.

Expiry/cancellation/payment/fulfillment operational mutation capabilities are not yet implemented; status currently preserves initial pending/blocked truth. The expiry timestamp is not an automatic expired-state service. Stable transaction reference is provider-neutral, not yet validated against a provider's request constraints.

## Planned remaining transaction API
The exact routes may evolve, but the domain capabilities are:
- create checkout session
- retrieve checkout session
- create/retrieve pending order
- initiate provider-neutral payment
- retrieve normalized payment state
- retrieve fulfillment state
- inspect safe customer-facing transaction status

Do not expose internal state transitions as arbitrary public mutation endpoints.

## 5. API response conventions
Public collection:
{ data: [], next_cursor: null }

Public single resource:
{ data: {...} }

Errors should expose a stable machine-readable code and safe human-readable message without SQL/provider/secret details.

## 6. Validation
Validate:
- UUID format
- pagination bounds
- required fields
- enum/state values
- currency format
- integer money representation
- quantity bounds
- ownership/relationship constraints

## 7. Authentication/authorization
Public catalog reads may remain unauthenticated.

Operator mutations, transaction operations requiring privileged access, and sensitive operational data must have an explicit authorization boundary before exposure.

## 8. Rate limiting
Public transaction endpoints must have a rate-limiting strategy before production exposure. The mechanism should be Cloudflare-compatible and selected according to actual traffic/risk.

## 9. Versioning
Prefer additive, backward-compatible API changes.

Breaking public contract changes require a documented migration/version strategy.

## 10. Current status
Foundation public reads and protected non-production checkout/pending-order creation/reads are implemented and locally verified. Payment/signal/fulfillment lifecycle services and public customer checkout are planned. Phase 2 is incomplete; the checkpoint has not been deployed or migrated remotely.
