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

Phase 1 public mutations return 405.

## 4. Planned transaction API
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
Only foundation read APIs are implemented. Checkout/payment/fulfillment APIs are planned and must not be represented as live capabilities.
