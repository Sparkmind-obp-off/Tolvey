# 15 — Genspark Build Phases & Session Strategy

## Objective
Build TOLVEY as a production-oriented Product House Hub + Commerce House Hub, using Genspark as an implementation environment while preserving a Cloudflare-compatible production architecture.

The build is divided into gated phases. One phase should normally be one focused Genspark session. Do not burn a large session trying to build the entire system blindly.

## Operating rule
One session = one bounded objective = one verifiable artifact/state change.

A session must end with:
- implementation completed or explicitly blocked
- tests run
- evidence captured
- files/commits identified
- next gate defined

## Phase 0 — Repository & Architecture Audit
Goal:
- read all existing TOLVEY docs
- inspect repository
- inspect current implementation
- identify gaps
- confirm Product House + Commerce House architecture
- confirm no marketplace V1 drift

Output:
- implementation plan
- risk list
- exact build order

Gate:
- architecture accepted and no contradictory assumptions remain

## Phase 0 audit evidence — 2026-09-30

### Scope and inspected snapshot
- Bounded objective: audit only; no application or payment implementation.
- Repository: https://github.com/Sparkmind-obp-off/Tolvey
- Branch: `main`; initial local HEAD and fetched `origin/main`: `832e4a4e189a3897e3bbde104e72222811235e0a`.
- Read `README.md` and every one of the 16 files under `docs/`, including documents 13–16.
- Git inventory: 17 tracked Markdown files; no additional remote branches appeared after fetch.

### Current state
Implemented artifacts are business and architecture documentation only: positioning, product hierarchy, commerce/channel principles, Money Kit hypothesis, security policy, testing/release requirements, provider-neutral transaction architecture, Duitku integration requirements, and phase gates.

No executable application exists. `package.json`, `src/`, `public/`, `tests/`, `migrations/`, `wrangler.jsonc`, `wrangler.toml`, and `.gitignore` are absent. No canonical persisted catalog, storefront, operator console, checkout, payment adapter, fulfillment, analytics pipeline, or runtime storage binding exists. Documented entities and examples are specifications, not implemented records or working APIs.

### Differences and clarifications
1. Document 09 previously used business roadmap numbering that overlapped engineering phases. Its headings now explicitly say business milestones; documents 15–16 govern engineering execution.
2. Document 11 previously listed storefront before product data. Its build order now follows the gated foundation-first plan. There is no running code to migrate.
3. Document 02 includes `price` in a conceptual product record, while the hierarchy and payment rules use Offer. Phase 1 must make Offer the authoritative sale-price source; any product-level price is display metadata derived from its offer, not a second monetary truth. Use integer IDR values and trusted server-side computation before checkout is introduced.
4. Document 13 gives Payment an `order_id`, while the high-level customer flow mentions Order after payment confirmation. Phase 2 must define an internal pending order/reference before provider initiation; payment confirmation updates that record, not a duplicate paid order. Keep this design explicitly reviewed when the transaction schema is implemented.
5. Security hardening is a later phase, but private operator access, secret isolation, and validation are baseline requirements from the first endpoint, not optional work deferred to Phase 6.

These clarifications do not change the owned-product business model or introduce marketplace infrastructure. No undocumented Duitku API behavior was selected. Current official provider specifications must be consulted in Phase 3; payment protocol verification was not performed during this audit.

### Gaps and risks
| Priority | Gap / risk | Smallest safe next action |
| --- | --- | --- |
| Blocker | No runnable application/build artifact | Phase 1A shell and build configuration, not an audit-session demo |
| High | No canonical persistent product/version/offer source | D1 migrations and integrity constraints; offer references an immutable version |
| High | No protected operator mutation boundary | Select and verify minimal BYOK-compatible operator authentication before exposing writes |
| High | Money Kit scope, buyer, price, and deliverable assets are unvalidated | Keep draft/unpublished; obtain actual operator-defined data, never fabricate sales or demand |
| High | No transaction persistence, idempotency, or state machine | Phase 2 atomic transitions, uniqueness constraints, concurrency and retry tests |
| High | No verified payment/fulfillment evidence | Phase 3 sandbox gate, then Phase 4 real assets and delivery; no paid status from browser navigation |
| High | No test suite, monitoring, recovery, or rollback evidence | Add tests with each bounded implementation; rehearse recovery before production validation |
| Medium | Domain ownership/DNS and existing production site not independently audited | Inspect actual account/project/domain before any deployment or DNS change |
| Medium | No ignore rules for future secrets/build/runtime artifacts | Add comprehensive `.gitignore` before Phase 1 credentials or generated files |

### Verification and evidence
- `git fetch origin` and `git ls-remote`: selected remote main matches the initial audited snapshot.
- `git ls-files` / `git ls-tree`: 17 tracked files, all documentation; absence checks confirmed the missing runtime paths above.
- `git fsck --no-dangling`: passed, exit code 0.
- Local `docs/*.md` reference check: no missing referenced documents.
- Limited tracked-file scan for private-key headers and common GitHub/AWS token patterns: no matching files. This is not a complete credential audit or proof that all secrets are absent.
- Unit, integration, browser, payment, and fulfillment tests: not runnable because implementation/test harness does not exist. Not reported as passing.
- GitHub credential setup: succeeded for the user-selected repository; push result must be reported after execution.
- Cloudflare BYOK credential setup: succeeded. No Wrangler authentication/permission check, account resource inventory, build, deploy, DNS change, or production transaction was performed in this audit.

### Gate and delivery
Phase 0 repository/architecture inspection is complete. The documented discrepancies are recorded and execution numbering/build order clarified; no implemented commerce gate has passed. This is not production readiness.

BYOK deployment is blocked by the absence of a deployable application. Creating a site merely to satisfy a deployment checkbox would cross into Phase 1 and violate this bounded audit scope. Existing Cloudflare projects and `tolvey.biz.id` remain unchanged by this session; their live state is not asserted.

### Recommended bounded build order
1. **Next session — Phase 1A:** establish Hono + TypeScript + Cloudflare Pages shell, secret-safe ignore/environment configuration, and D1 Product/ProductVersion/Offer migrations with validation tests. Gate: clean build and migration/integrity tests pass; no payment or public operator mutations. This is a foundation sub-gate, not the complete Phase 1 gate.
2. **Phase 1B:** persisted canonical catalog reads, validated offer publication, basic storefront, and authenticated operator foundation. Gate: canonical product/version can become a publishable offer; draft/archived records stay unsellable. First meaningful BYOK deploy follows build, tests, auth/resource review, and protected-route checks.
3. **Phase 2:** provider-neutral transaction core with pending order references, idempotency, audit events, and concurrency-safe tests; test provider must be explicitly non-production.
4. **Phase 3A–3D as needed:** official Duitku specification/config review; adapter; POP flow; callback verification/idempotency and sandbox end-to-end evidence. Stop if required account credentials are unavailable.
5. **Phase 4:** real product assets, verified delivery, customer outcome, and truthful analytics.
6. **Phases 5–7:** useful distribution only, operational hardening, then controlled production payment/fulfillment/recovery evidence.
7. **Phase 8:** optimize only after real transaction evidence.

## Phase 1 — Foundation
Build:
- application shell
- environment configuration
- product/offer model
- canonical catalog
- basic storefront
- operator/admin foundation
- Cloudflare-compatible project structure

Gate:
- product can be created/read/published in canonical form

## Phase 2 — Transaction Core
Build:
- CheckoutSession
- Order
- Payment
- Fulfillment
- transaction state machine
- idempotency
- event/audit model
- transaction APIs

Gate:
- a test order can move safely through checkout/payment/fulfillment states without a provider

## Phase 3 — Duitku POP
Build:
- Duitku provider adapter
- sandbox configuration
- checkout initialization
- popup/redirect integration as supported
- callback verification
- payment-status normalization
- failure/retry handling
- safe return page
- transaction logging

Gate:
- verified sandbox payment completes end-to-end
- duplicate/invalid/mismatched callbacks are handled safely

## Phase 4 — Product-to-Commerce Loop
Build:
- real product offer
- product page
- checkout
- Duitku POP
- order record
- fulfillment/delivery
- customer outcome
- transaction analytics

Gate:
- a real customer can discover → checkout → pay → receive/use the product

## Phase 5 — Distribution
Build only the minimum needed:
- channel registry
- canonical product export
- channel listing model
- source attribution
- external-channel order normalization where feasible
- links/deep links to external commerce channels

Possible channels:
- TOLVEY direct storefront
- Link.id-style link commerce
- marketplaces
- social commerce
- affiliate/creator distribution

Gate:
- the same canonical product can be distributed to more than one channel without duplicating the source of truth

## Phase 6 — Observability & Security Hardening
Build:
- structured events
- correlation IDs
- transaction dashboard
- error monitoring
- secret handling
- access controls
- webhook/callback protection
- audit logs
- backup/recovery considerations

Gate:
- operator can determine what happened to a transaction without inspecting raw production infrastructure manually

## Phase 7 — Production Validation
Run:
- unit tests
- integration tests
- E2E checkout tests
- Duitku sandbox regression
- security checks
- failure-path tests
- production configuration review
- rollback rehearsal

Then:
- controlled production transaction
- verify real payment
- verify fulfillment
- verify analytics
- record evidence

Gate:
- production launch decision based on evidence, not visual completion

## Phase 8 — Optimization
Only after real transactions:
- automate repetitive work
- improve conversion
- add more payment providers
- add more channel adapters
- improve product catalog tooling
- add subscriptions/bundles/affiliate features if justified
- optimize costs

## Explicit non-goals for V1
Do not build:
- multi-vendor marketplace
- seller onboarding
- seller wallets
- escrow
- seller commission engine
- complex recommendation engine
- full ERP/accounting system
- unnecessary microservices
- every marketplace integration at once

## Session budget discipline
Prefer small sessions with a clear output.

Recommended order:
1. audit
2. foundation
3. transaction core
4. Duitku POP
5. real product checkout
6. distribution
7. security/observability
8. production validation

If a phase exposes a blocking architecture problem, stop and fix the smallest root cause before proceeding.

## Definition of done
TOLVEY V1 is not done because the website looks finished.

V1 is done when:
- a canonical product exists
- an offer can be published
- a customer can reach checkout
- direct payment can be processed through Duitku POP
- payment confirmation is verified server-side
- order state is persisted
- fulfillment completes
- transaction evidence is observable
- at least one real transaction has been successfully completed
- the system remains compatible with additional channels/providers
