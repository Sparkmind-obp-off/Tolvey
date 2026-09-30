# TOLVEY — Roadmap & Decision Log

## Roadmap numbering clarification — 2026-09-30

The phases below are business milestones, not engineering session gates. For engineering execution, use `docs/15-genspark-build-phases.md` and `docs/16-master-system-prompt-genspark.md`: Phase 0 is audit, Phase 1 is foundation, and Phase 2 is transaction core. Do not interpret the business roadmap as permission to skip these gates.

## Business milestone 0 — Foundation

Status: documentation established at the Phase 0 snapshot; Phase 1 now implements and verifies Hono/TypeScript/Pages runtime, D1 Product/ProductVersion/Offer schema, read-only APIs, and automated tests. This is technical foundation, not business product proof. Domain acquisition below remains a repository assertion; no custom-domain/DNS change was performed.

- Brand locked operationally
- Domain acquired: tolvey.biz.id
- Product House + Commerce House positioning defined
- Repository created
- Architecture documentation established

## Business milestone 1 — Product proof

- Define Money Kit v1
- Validate target buyer/problem
- Create minimum sellable product
- Establish owned storefront
- Establish payment and delivery path
- Make first real transactions

## Business milestone 2 — Distribution proof

- Select relevant established marketplaces
- Establish social distribution workflow
- Normalize channel data
- Measure channel performance
- Reduce repetitive manual work

## Business milestone 3 — Commerce operating system

- unified catalog
- order normalization
- fulfillment status
- channel adapters
- operator dashboard
- product analytics

## Business milestone 4 — Scale

Only after evidence: automation, subscriptions, bundles, affiliates, additional product families, broader marketplace integrations, and deeper customer lifecycle tooling.

## Decision log

### D-001 — TOLVEY as master brand
Decision: LOCK.
Reason: Cycle 2 naming work and subsequent manual clearance checks supported proceeding with TOLVEY.

### D-002 — Product House + Commerce House
Decision: LOCK FOR CURRENT PHASE.
Reason: preserves broad product ownership while making distribution and transactions first-class.

### D-003 — Not a marketplace in V1
Decision: LOCK FOR V1.
Reason: owning products and distribution is simpler and validates demand before platform-side complexity.

### D-004 — Money Kit as first product territory
Decision: WORKING HYPOTHESIS.
Reason: aligned with practical product-kit architecture; still requires real demand and transaction validation.

### D-005 — Complete Phase 1 scope clarification (2026-09-30)
Decision: follow the latest explicit Phase 1 execution command, as one engineering phase with the complete Foundation Gate. Earlier storefront/operator requirements and externally named Phase 1 subdivisions are superseded.
Context/evidence: baseline main `25feb61` contained documentation only; the current session establishes executable code, real D1, tests and read-only verification without customer checkout.
Trade-off: do not build an operator authentication service while no operator HTTP mutations exist; trusted operator SQL is the only current catalog-write mechanism. Storefront commerce and authenticated operator writes remain future work.
Affected documents: README and docs/02, 09, 11, 12, 15, 16.
Security boundary: public mutations are denied; local/test never use remote production. Optional remote staging creation hit D1 quota; preview deliberately has no DB binding rather than sharing production.
Money policy: Offer owns sale-price truth, stored as safe integer minor units with explicit currency/exponent. IDR uses whole-rupiah exponent 0 in test fixtures; production has no product/price records.

## Change rule

Any change to brand, business model, or core architecture requires a written decision with context, evidence, decision, trade-offs, affected documents, and date.
