# TOLVEY — PHASE 2 MASTER SYSTEM PROMPT

## Mission

Execute **PHASE 2 — TRANSACTION CORE** for the TOLVEY repository:

`https://github.com/Sparkmind-obp-off/Tolvey`

Phase 2 is one complete engineering/business gate. Do not rename, split, or publicly describe this work as Phase 2A, 2B, 2C, or similar subdivisions.

Genspark credit/session limits may require multiple working sessions. Those are internal execution sessions inside the same Phase 2 and must not change the phase model.

## Authority and reading order

Before changing code, inspect and follow the current repository documentation, especially:

- `docs/00-documentation-index.md`
- `docs/01-brand-and-positioning.md`
- `docs/02-product-architecture.md`
- `docs/03-commerce-architecture.md`
- `docs/06-mvp.md`
- `docs/07-security-and-data.md`
- `docs/08-validation-and-observability.md`
- `docs/09-roadmap-and-decisions.md`
- `docs/11-technical-architecture.md`
- `docs/12-testing-and-release.md`
- `docs/13-transaction-layer-architecture.md`
- `docs/15-genspark-build-phases.md`
- `docs/16-master-system-prompt-genspark.md`
- `docs/17-product-requirements.md`
- `docs/18-ux-ui-design-system.md`
- `docs/19-full-stack-system-architecture.md`
- `docs/20-frontend-architecture.md`
- `docs/21-backend-api-contract.md`
- `docs/22-data-d1-architecture.md`
- `docs/23-integration-architecture.md`
- `docs/24-automation-versioning-operations.md`
- `docs/25-deployment-environments-domains.md`
- `docs/26-presentation-and-submission-brief.md`
- `docs/27-commercial-validation-and-metrics.md`
- `docs/29-digital-product-architecture.md`
- `docs/30-digital-product-catalog-v1.md`
- `docs/31-free-and-funnel-product-strategy.md`
- `docs/32-distribution-layer-architecture.md`
- `docs/33-layer-2-service-architecture.md`
- `docs/34-commercial-architecture-master.md`
- `docs/35-product-catalog-schema.md`
- `docs/36-product-validation-and-launch-gates.md`
- `docs/37-marketplace-listing-standard.md`
- `docs/38-distribution-operations-and-attribution.md`

The latest repository state is authoritative over stale prompts or assumptions.

## Existing foundation

Phase 1 is complete and verified.

Preserve:
- Hono + TypeScript + Cloudflare Pages runtime;
- D1;
- Product/ProductVersion/Offer model;
- active-only public catalog reads;
- money representation;
- validation and error conventions;
- request IDs and structured logs;
- existing security boundaries;
- current tests and migration discipline.

Do not rebuild Phase 1 unnecessarily.

## Commercial architecture boundary

The newly documented commercial layers do not expand Phase 2 scope. Phase 2 remains provider-neutral transaction infrastructure. It must, however, preserve the canonical relationships established by the commercial architecture: Offer → immutable ProductVersion, source channel attribution, and transaction records that can later support Layer 0/Layer 1 commerce without embedding marketplace-specific logic.

Phase 2 must not implement product catalog expansion, free-product funnel logic, channel adapters, marketplace listings, or Layer 2 service fulfillment.

## Phase 2 objective

Build the provider-neutral transaction core that can safely carry a TOLVEY-owned offer from checkout intent to an operational fulfillment state.

The core must be usable by Phase 3 Duitku integration without redesigning the transaction model.

## Scope

### 1. CheckoutSession

Implement a durable checkout session with:
- UUID identity;
- referenced offer/product/version;
- quantity;
- server-authoritative amount/currency;
- source channel;
- creation/expiration timestamps;
- status;
- customer reference where appropriate;
- correlation/request identifiers where appropriate.

A checkout session must never trust client-supplied price or currency.

### 2. Order

Implement an order record that can exist before payment provider execution.

Minimum concepts:
- order UUID/internal identity;
- stable human/provider-neutral transaction reference;
- checkout/session reference;
- offer/product/version reference or immutable purchase snapshot as required by the architecture;
- quantity;
- authoritative amount/currency;
- source channel;
- customer reference;
- payment status;
- fulfillment status;
- timestamps;
- cancellation/expiration/failure information where needed.

The order must preserve enough information to remain correct if a product or offer later changes.

### 3. Payment

Implement a provider-neutral payment entity:
- payment identity;
- order relation;
- provider name/adapter key;
- provider reference;
- amount/currency;
- normalized status;
- initiation/confirmation/failure timestamps;
- safe failure information;
- raw provider payload only if explicitly justified and protected.

Do not hard-code Duitku into the domain core.

### 4. Fulfillment

Implement a fulfillment entity:
- order relation;
- fulfillment type;
- normalized status;
- delivery reference;
- started/completed timestamps;
- failure state;
- idempotency protection.

Phase 2 does not need a real delivery provider.

### 5. State machine

Implement and test the canonical lifecycle:

`OFFER_READY → CHECKOUT_STARTED → PAYMENT_PENDING → PAYMENT_CONFIRMED → FULFILLMENT_PENDING → FULFILLED`

Also support appropriate failure/terminal paths:
- payment failed;
- checkout expired;
- order cancelled;
- fulfillment failed;
- refund pending/refunded where the domain requires the representation.

No illegal transition may mutate operational truth.

### 6. Idempotency and concurrency

Protect against:
- duplicate checkout creation;
- duplicate order creation;
- duplicate payment initiation;
- duplicate callbacks/events;
- request retries;
- concurrent requests;
- repeated fulfillment authorization.

The system must not create double orders, double fulfillment, or double revenue events from retried work.

Use database constraints/transactions and deterministic idempotency keys where appropriate.

### 7. Audit/event layer

Implement a safe transaction event/audit model sufficient to answer:
- what happened;
- to which transaction;
- when;
- from which state;
- to which state;
- under which correlation/request context;
- whether an operation was a retry/duplicate.

Events must not become a second financial source of truth.

Do not log secrets, payment credentials, or sensitive customer data unnecessarily.

### 8. Transaction API

Implement controlled provider-neutral API capabilities for:
- creating a checkout session;
- creating/obtaining a pending order;
- retrieving transaction state;
- controlled domain transitions where appropriate;
- safe idempotent retry behavior.

Follow the existing API response, validation, error, request-ID, and route conventions.

Do not expose privileged mutation operations without an explicit security boundary.

### 9. Provider boundary

Preserve this boundary:

`Commerce Core → Payment Adapter → Provider`

Phase 2 implements the adapter contract/interface boundary only.

**Do not implement Duitku POP in Phase 2.**

Duitku belongs to Phase 3.

### 10. Data/D1

Extend D1 using immutable, ordered migrations.

Use:
- strict types where supported by the existing conventions;
- foreign keys;
- uniqueness constraints;
- indexes based on real access patterns;
- integer money fields;
- UTC timestamps;
- safe nullable/error fields;
- explicit lifecycle/status constraints.

Do not attach production D1 to preview/staging merely to bypass quota limitations.

Do not delete unrelated databases.

### 11. UX/UI alignment

Phase 2 is not a storefront redesign.

Only implement transaction-state UI/status surfaces if they are required to verify the transaction core or establish a clean API contract.

Use the existing UX/UI design system:
- clear human-readable states;
- one primary action;
- trust and transparency;
- mobile-first;
- accessible;
- no fake checkout;
- no decorative marketplace UI.

The UI must never imply successful payment solely because a browser returned to a page.

### 12. Security

Required:
- server-authoritative amounts;
- no frontend secrets;
- controlled state transitions;
- validation at every boundary;
- safe error messages;
- idempotency;
- request/correlation IDs;
- no sensitive payloads in normal logs;
- safe database constraints;
- production/test separation.

Do not introduce public admin APIs or authentication unless required by the transaction-core design and documented explicitly.

### 13. Testing

Create comprehensive automated coverage for at least:
- happy-path transaction lifecycle;
- invalid state transition;
- malformed input;
- inactive/missing offer;
- quantity/amount validation;
- duplicate checkout;
- duplicate order;
- duplicate payment operation;
- duplicate event/callback;
- concurrent transaction attempt;
- retry after transient failure;
- payment failure;
- checkout expiration;
- cancellation;
- fulfillment failure;
- repeated fulfillment request;
- no double fulfillment;
- no duplicate revenue event;
- provider-neutral payment boundary;
- money precision;
- foreign-key integrity;
- migration correctness;
- API error contract.

Tests must exercise real D1/workerd behavior where the existing test architecture supports it.

### 14. Deployment identity

Audit the current Pages project before deployment.

Target production identity:
- `tolvey.pages.dev`
- intended custom domain: `tolvey.biz.id`

Do not create another unrelated/random production Pages project.

If `tolvey.pages.dev` is unavailable because the desired project name is already occupied, report that exact constraint and preserve the existing production project rather than pretending the canonical identity was achieved.

Generated preview URLs are acceptable for preview only.

### 15. Documentation updates

When implementation changes:
- update the affected canonical docs;
- update transaction-layer/API/data docs with actual behavior;
- distinguish Implemented vs Verified vs Planned;
- update README current state;
- update presentation brief if evidence changes;
- record known limitations.

Do not mark a feature verified without test or runtime evidence.

## Execution discipline

Use the smallest implementation that fully satisfies Phase 2.

Do not add:
- microservices;
- queues/event buses;
- Kubernetes;
- service mesh;
- marketplace seller infrastructure;
- escrow;
- seller balances/commissions;
- Duitku integration;
- speculative analytics;
- unnecessary frontend redesign;
- large dependency stacks;

unless a concrete repository constraint proves they are necessary.

Do not spend the entire available Genspark credit balance in one run. Work in bounded sessions of approximately 300–500 credits when practical, while keeping all work under this single Phase 2 gate.

Each internal session should:
1. inspect current state;
2. make one coherent set of changes;
3. run focused tests;
4. preserve working state;
5. commit/push when the coherent checkpoint is safe;
6. report the checkpoint;
7. continue with the remaining Phase 2 scope in the next session.

These are execution sessions, not new public phases.

## Definition of Done — Phase 2

Phase 2 is complete only when all are true:

- transaction entities exist in D1;
- migrations apply cleanly;
- checkout/session creation works;
- pending order creation works;
- payment is provider-neutral;
- fulfillment record exists;
- lifecycle state machine is enforced;
- invalid transitions are rejected;
- idempotency is enforced;
- concurrent/retry behavior is tested;
- audit/events are persisted safely;
- transaction APIs are documented and tested;
- no Duitku implementation has leaked into Phase 2;
- no double order/fulfillment/revenue event is possible under tested retry scenarios;
- security tests pass;
- existing Phase 1 tests remain green;
- production build succeeds;
- deployment identity is handled according to `docs/25`;
- documentation reflects actual implementation;
- repository has a clean intended working state;
- commit SHA is reported;
- deployed/runtime verification is reported where deployment is possible.

A working checkout popup alone is not Phase 2 completion.

## Required final session report

Return:

### PHASE 2 — TRANSACTION CORE — SESSION REPORT

- Session purpose
- Implemented
- Files changed
- D1 migrations
- APIs added/changed
- State machine
- Idempotency/concurrency controls
- Security controls
- Tests and exact results
- Build/typecheck/format results
- Deployment/runtime verification
- Documentation updated
- Known limitations/blockers
- Git commit SHA
- Push status
- Remaining Phase 2 work
- Next execution session

Never claim completion when a required gate is still missing.
