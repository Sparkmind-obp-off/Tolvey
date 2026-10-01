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

- Select one real launch candidate; Money Kit v1 remains an optional working hypothesis
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

### D-006 — Phase 2 durable checkout checkpoint, non-production boundary (2026-09-30)
Decision: one coherent checkpoint inside the existing Phase 2 gate; do not declare Phase 2 complete or enter Phase 3.
Context: main `1b73d3b` contains the complete commercial/system docs but only Phase 1 executable functionality. The new checkpoint persists checkout/pending order/blocked fulfillment/events atomically and adds provider-neutral schema/contracts without a provider.
Reason: prove canonical immutable purchase truth, retries and concurrency before extending payment/fulfillment execution. Server-authoritative SQL snapshots and referenced-version immutability preserve the commercial architecture without catalog expansion.
Security trade-off: a feature-flagged, private single-service bearer boundary is genuinely required for the new internal create/status operations; it is non-production only and is not customer auth, an unrestricted admin API, or Hosted route admission. Production access/rate-limiting/record-authorization/full-lifecycle release review remain mandatory.
Deployment decision: preserve the existing Phase 1 Pages project and remote schema; no checkpoint deploy or random replacement identity. Account project `tolvey` is absent (404), not proof of global hostname availability.
Evidence: 109 passing tests, local fresh/upgrade migrations and runtime create/replay/authorization checks. No confirmed payment or completed delivery is claimed.
Affected documents: README, docs/00, 02, 07, 09, 12, 13, 15, 21, 22, 23, 25, 26. This does not change the owned-product/no-marketplace model.

### D-007 — Complete provider-neutral Phase 2 locally, no remote release (2026-09-30)
Decision: follow the latest continuation gate, finishing internal lifecycle without a provider, public mutations or production enablement. No Phase 3 work.
Context: baseline d0c7b5a has durable checkout/schema but no lifecycle. Add migration 0003 only; preserve prior migrations/production identity.
Reason/trade-off: revision-owned D1 batches and immutable operation/key/replay receipts provide concurrency/atomicity without queues or new dependencies. Expose a local/test-only simulation factory, not an arbitrary public success endpoint. Future real adapters require authenticated gateway review. REFUND_PENDING is request-only, never external refund confirmation.
Evidence: 150 tests, compiled workerd lifecycle, eight rollback/retry paths, fresh/upgrade/FK/integrity, build/typecheck/format and PM2 deny-by-default. Git delivery recorded in final report. No money/customer/delivery/revenue/demand evidence manufactured.
Affected docs: README, 00, 07, 09, 12, 13, 15, 21, 22, 23, 25, 26. No commercial-model or phase numbering change.

### D-008 — Production connection is not commerce activation (2026-10-01)
Decision: record `d73a4df` as the deployed production-connection release, not full Phase 3/payment completion.
Evidence: 237 local/workerd tests and real deployed correct-signature/negative-control authentication, with no invoice; secrets stored encrypted. Production gateway/checkpoint/callback execution disabled, remote transaction migrations not applied.
Trade-off: retain secure connectivity without exposing unfinished customer commerce. Original live sandbox gate remains incomplete; any alternative verification scope needs explicit approved gate revision. Affected: README, 00, 07, 11–15, 19, 21–23, 25–27, 34, 39.

### D-009 — Three engines, offering tiers and phases are separate (2026-10-01)
Decision: Own Commerce, Distribution, Brand/Demand are business engines; free/digital/services are offering tiers; 0–8 are engineering gates.
Reason: ambiguous Layer 1/2 wording mixed distribution with services and made work look like expanding catalog inventory.
Trade-off: keep existing product-tier labels where clearly scoped, correct engine labels and Money Kit compulsory wording. Affected: 06, 15–19, 27, 29–36, 39. No brand/model change or marketplace added.

### D-010 — Commercial vertical slices and baseline launch dependencies (2026-10-01)
Decision: docs/19 governs target full cycle; docs/15 lists gaps/dependencies. Publication/customer pages/access/private delivery/operator exceptions and baseline security/recovery belong to the integrated first loop. Phase 7 release does not wait for all distribution adapters or advanced dashboards.
Reason: audit found strong local infrastructure but no customer-consuming loop; deferring baseline controls would produce unsafe paid launch.
Trade-off: retain phase numbering and Phase 3 live gate; permit independently authorized package/content/read-only work during provider blocker, never paid execution. Services initially scoped inquiry; external intake needs distinct source model, not fake own checkout. Affected: 06–07, 10, 12–13, 15–23, 27, 32–38.

### D-011 — Bounded session contract, not repeated brainstorming (2026-10-01)
Decision: replace broad master prompt with objective/input/output/acceptance/environment/side-effect/non-goal/handoff contract. Targeted read/test iterations, full regression before code release; archive completed Phase 2 prompt.
Reason: repeatedly reading 40 docs and probing unchanged credentials spends effort without closing product-to-customer dependencies.
Trade-off: audits still read all docs when requested; ordinary continuation must inspect changed relevant source/contracts, not skip safety. One phase can span sessions; no public A/B/C subdivisions or invented credit guarantees. Current session changes docs only and does not authorize Phase 4 code/deploy/payment. Affected: 00, 15–16, 28, README.

## Change rule

Any change to brand, business model, or core architecture requires a written decision with context, evidence, decision, trade-offs, affected documents, and date.
