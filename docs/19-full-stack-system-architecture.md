# TOLVEY — Full-Stack System Architecture

## 1. System view
TOLVEY is a modular application, not a collection of premature microservices.

Canonical flow:

Demand → Product → Offer → Distribution → Checkout → Order → Payment → Fulfillment → Customer Outcome → Measurement.

## 2. Layers
### Experience layer
Customer storefront, product pages, checkout/status pages, future operator console.

### Application/API layer
Hono routes, validation, authorization boundaries, transaction orchestration, response contracts.

### Domain layer
Product, Offer, CheckoutSession, Order, Payment, Fulfillment, Channel, Event.

### Persistence layer
Cloudflare D1 for structured operational records; R2 may be introduced later for private product/delivery assets.

### Integration layer
Payment providers, distribution channels, notification/delivery services, and other external systems through adapters.

### Observability layer
Request IDs, structured events, audit history, metrics/logs, error signals.

## 3. Runtime
Primary production direction:
- Cloudflare Pages/Workers-compatible Hono application
- D1 relational persistence
- R2 only when asset/delivery requirements justify it
- external providers behind explicit adapter boundaries

## 4. Data ownership
TOLVEY owns canonical product, offer, order, and normalized transaction records.

External platforms own their own channel/payment execution records.

TOLVEY stores normalized references and verified signals rather than pretending external systems are internal databases.

## 5. Request flow
Client → Hono route → validation → domain/service logic → D1/provider adapter → normalized response.

Secrets and provider credentials never cross into public client code.

## 6. Reliability
- deterministic state transitions
- idempotency keys
- unique constraints
- safe retries
- callback deduplication
- no duplicate fulfillment
- additive migrations
- rollback without deleting transaction history

## 7. Current implementation boundary
Phase 1 implements only the runtime, canonical catalog persistence, health/readiness, and public read APIs.

Phase 2 introduces provider-neutral transaction persistence/state/idempotency.

Phase 3 introduces Duitku.

Later phases introduce real delivery, distribution, hardening, and production validation.

## 8. Architectural non-goals
Do not introduce queues, service meshes, Kubernetes, event buses, or microservices unless actual scale/reliability evidence requires them.
