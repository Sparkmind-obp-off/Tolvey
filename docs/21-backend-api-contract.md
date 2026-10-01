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

Status: locally verified protected checkpoint API; Phase 2 local/test lifecycle gate is now complete. Not a customer checkout API.

Authorization/configuration: `DB`, explicit non-production APP_ENV, `TRANSACTION_CORE_ENABLED=true`, and random private `TRANSACTION_CORE_TOKEN` (32–256 characters). Bearer credential is server-side only. One internal service principal may read all checkpoint records; no customer/tenant authorization is claimed. Production is rejected even with the flag/token, and default configuration is disabled. No public exposure before rate-limit/access/full-lifecycle review.

- POST `/api/transaction-core/checkouts`: bounded 2048-byte application/json; only `offer_id` UUIDv4, integer `quantity` 1–100, `source_channel` (1–64 lowercase letters/digits/`._-`, begins alphanumeric), optional opaque UUID `customer_reference`. Reject unknown fields, including client amount/currency/status. Customer contact/PII is not accepted.
- Header `Idempotency-Key`: 16–128 ASCII letters/digits/`._:-`; raw key is never persisted/logged/returned. Operation scope is `checkout.create:v1` for the single internal service principal.
- 201 `{ data: { checkout, order, replayed: false } }` on creation; 200 with identical snapshots and `replayed: true` on matching retry; 409 `IDEMPOTENCY_CONFLICT` for reused key with changed meaning. Checkout and order are created together, not via a second independently retryable mutation.
- GET `/api/transaction-core/checkouts/:id`; GET `/api/transaction-core/orders/:id`: protected snapshots/status; malformed UUID 400, nonexistent 404. Private delivery/customer reference, key/hash and version metadata are excluded from DTOs.
- 503 `TRANSACTION_CORE_UNAVAILABLE` when disabled/incomplete/production; 401 `UNAUTHORIZED`; malformed/body/content/type/key input 400; unavailable offer 404; oversized body 413; generic unexpected error 500. Error shape `{ error, message, request_id }`, no SQL/provider/credential details.
- `/ready` retains default foundation behavior and adds transaction-schema/config probes when the flag is true.
- GET/HEAD/OPTIONS conventions stay intact; the exact checkpoint create POST bypasses the global mutation barrier; Phase 3 adds authenticated provider callback and private operational connection-check exceptions described below. Other mutation paths still return 405. No payment-confirmation/fulfillment/arbitrary transition mutation route exists.

Expiry/cancellation/payment/fulfillment capabilities are implemented as internal functions only (below), not HTTP routes. Expiry is explicit, not scheduled; initiation/confirmation reject overdue orders regardless of sweep. Stable transaction reference is provider-neutral; real provider constraints/authentication remain Phase 3.

## Implemented internal lifecycle contract (no HTTP)

`createSimulationCore(db, environment)` accepts only trusted local/test configuration. Methods: initiatePayment(id,{provider,provider_reference},context); processSignal(id,normalizedSignal,context); expireOrder/cancelOrder/authorizeFulfillment/completeFulfillment/failFulfillment/requestRefund(id,context).

Context: operation-scoped key, UUID request_id, optional trusted test/local UTC Date. Return `{receipt,replayed}` with immutable original outcome, not current state. Same meaning replays; changed key/event meaning conflicts. Signal status allowed only CONFIRMED/FAILED, exact provider/payment/transaction reference and canonical amount/currency/exponent match. No browser Request is accepted, no provider verification is claimed. Environment checks reject staging/production; no application route imports the simulator.

409 codes include IDEMPOTENCY_CONFLICT, CONCURRENT_TRANSITION, terminal/invalid states, expired order, reference/money mismatches, reference reuse, unpaid fulfillment/refund. Invalid shape/context/key is 400, missing order 404, unavailable atomic transaction 503. No SQL/raw errors in outward lifecycle errors. New key required for retry authorization after failed fulfillment. Repeated expiry/cancel/refund requests replay the original transition even with a new key. REFUNDED is not exposed.

Readiness with the transaction flag requires migration 0003's revision/operation/key/replay schema as well as 0002. Disabled/default catalog readiness remains backward-compatible.

## Planned public transaction API
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
Foundation reads, protected non-production checkout/order API and internal local/test lifecycle are implemented and verified (150 tests). Phase 2 continuation gate is complete, subject to final Git delivery. Public customer checkout is not implemented. The Phase 3 sandbox adapter below verifies contract/authentication locally; live provider verification remains blocked. Transaction migrations/services have not been deployed or migrated remotely.

## Phase 3 production connection release — 2026-10-01

The latest user request authorizes production credential installation and BYOK application deployment, not paid commerce. Existing project `webapp-3` now deploys explicit production provider configuration with Cloudflare Secrets. Production gateway/checkpoint execution stays disabled; canonical migrations/core unchanged. Sandbox code below remains local/test-only.

- POST `/api/provider/duitku-pop/connection/check`: server-only operator bearer `DUITKU_OPERATOR_TOKEN` (32–256 chars), separate from provider credentials. Enabled/matching provider environment + DB + config required. Missing/wrong auth 401 with no provider network call. Neither body nor query controls provider URL, amount, order or credentials. Operational business/API authorization, not Hosted site admission.
- Two deliberately empty production POP requests: correct HMAC must get required-amount validation HTTP 400; changed signature control must return 401. No valid invoice payload or canonical data mutation. Success HTTP 200 `{data:{environment:"production",authentication:"verified",invoice_created:false,payments_enabled:false}}`. Failure 503 with only bounded operator diagnostics (HTTP statuses, boolean flags, timestamp, static cause); raw provider response/errors/secrets excluded.
- `/ready` for this production connection release checks foundation schema + provider config + operator-secret presence; it does not send provider traffic or claim payment readiness. Sandbox readiness still probes all four migrations. Default public status page remains honest about unavailable buying/delivery.
- Production callback and transaction checkpoint POSTs remain 503. No public initiation/payment/fulfillment route. Neutral return remains 200 and cannot confirm payment. Actual deployed connection HTTP 200 verified through real provider calls; no paid order/callback/delivery claimed. See docs/14 for evidence/secret contract.

## Historical Phase 3 sandbox provider boundary — 2026-10-01

Status: CODE COMPLETE / SANDBOX BLOCKED; LOCAL CONTRACT TEST ONLY. See docs/14 for exact wire formulas and unverified live prerequisites.

POST `/api/provider/duitku-pop/callback` is the only new publicly reachable mutation. Disabled by default, production/staging forbidden. Requires valid sandbox configuration and provider HMAC, form-urlencoded, actual streamed limit 8192 bytes, strict UTF-8/percent encoding and no duplicate fields. Valid merchant/order/money/reference + first-notification status query + core transition required before HTTP 200 plain OK. Identical authenticated replay is 200 without repeating confirmation. Malformed 400, authentication 401, unknown 404, conflicts/terminal 409, oversized 413, unavailable/pending 503. Outward body is generic PAYMENT_NOTIFICATION_REJECTED + request ID; no raw errors or payloads. Authentication is provider business authorization, not Hosted site admission.

GET `/payments/duitku-pop/return` is neutral processing text, ignores supplied query, never mutates or exposes transaction truth. No public initiation/admin/arbitrary confirmation/fulfillment/refund routes.

Private function `duitkuGateway(env).initiate(orderId,{email},requestId)`: only email contact input, canonical server money/order ID. Email is required by POP, transmitted to provider and retained only as a request fingerprint, not plaintext. Concurrent outbound invoice attempts are reserved once; ambiguous outcomes require reconciliation rather than blind retry. READY persisted receipt can recover canonical attachment. No caller-provided amount/status overrides.

DUITKU_POP_ENABLED readiness checks config + all four migrations. Default foundation readiness stays unchanged. `createPaymentCore` reuses the generic Phase 2 engine and exposes only payment initiation/signal processing to the authenticated sandbox gateway; simulation wrapper remains unexposed. Production gate is explicitly not enabled.
