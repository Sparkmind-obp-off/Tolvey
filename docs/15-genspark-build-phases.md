# 15 — Genspark Build Phases & Session Strategy

## Objective
Build TOLVEY as a production-oriented Product House Hub + Commerce House Hub, using Genspark as an implementation environment while preserving a Cloudflare-compatible production architecture.

The build is divided into gated phases. One phase should normally be one focused Genspark session. Do not burn a large session trying to build the entire system blindly.

## Operating rule
One session = one bounded objective = one verifiable artifact/state change.

The latest explicit Phase 1 command (2026-09-30) defines **one complete PHASE 1 — FOUNDATION**. Session limits may split working sessions, not name new phases or reduce the Foundation Gate. It supersedes the audit's previous externally named subdivisions and the earlier storefront/operator scope for Phase 1.

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

### Historical state at the Phase 0 snapshot
Implemented artifacts were business and architecture documentation only: positioning, product hierarchy, commerce/channel principles, Money Kit hypothesis, security policy, testing/release requirements, provider-neutral transaction architecture, Duitku integration requirements, and phase gates.

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
| Blocker | No runnable application/build artifact | Phase 1 shell and build configuration, not an audit-session demo |
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
Updated to follow the explicit Phase 1 execution command:
1. **Phase 1:** complete executable foundation with TypeScript/Hono/Pages, safe environment configuration, D1 Product/ProductVersion/Offer schema/migrations, read-only catalog and health/readiness, real automated tests, clean install/build/runtime verification, documented evidence, and clean commit/push to main. No public mutations, checkout, payment, delivery, or speculative operator authentication.
2. **Phase 2:** provider-neutral transaction core with pending order references, idempotency, audit events, and concurrency-safe tests; test provider must be explicitly non-production.
3. **Phase 3:** official Duitku specification/config review; adapter; POP flow; callback verification/idempotency and sandbox end-to-end evidence. Use multiple bounded sessions as needed. Stop if required account credentials are unavailable.
4. **Phase 4:** real product assets, verified delivery, customer outcome, and truthful analytics.
5. **Phases 5–7:** useful distribution only, operational hardening, then controlled production payment/fulfillment/recovery evidence.
6. **Phase 8:** optimize only after real transaction evidence.

## Phase 1 — Foundation
Current scope: the explicit Phase 1 command supersedes earlier storefront and operator UI/authentication requirements. There are no externally named subdivisions of Phase 1.

Build:
- TypeScript/Hono application runtime and Cloudflare Pages configuration
- local/test/production environment and secret boundaries
- D1 canonical Product, ProductVersion, Offer schema and migrations
- health/readiness and minimal validated public read APIs
- repository-safe configuration, explicit local-only fixtures where useful
- deterministic monetary representation and relationship integrity
- automated source/API/schema and compiled-runtime tests
- clean install, typecheck, formatting, build, migration/runtime verification
- documentation reconciliation and clean commit/push to main

Foundation Gate:
A clean dependency installation and fresh database must support build, migration initialization, tests, startup, health/readiness, and canonical persistence/read verification. Secrets must not be committed; Git must be committed, pushed, remote SHA verified, and clean. No Phase 2 implementation is permitted here.

### Phase 1 implementation evidence — 2026-09-30
- Baseline inspected: local/fetched main `25feb61f1f453df5b73922bb39886047317fa3d1`; no implementation existed before this session.
- Runtime: Hono 4.13.11, TypeScript 5.9.3, Pages Worker build using Vite and Wrangler; application contains no Node runtime imports.
- Persistence: `migrations/0001_canonical_catalog.sql`, three STRICT domain tables, FK/composite-FK/unique/CHECK constraints, lifecycle defaults, indexed read access. No transaction/customer/marketplace tables were added.
- Offer price uses safe nonnegative integer minor units, explicit currency and exponent; IDR fixture 20000/exponent 0 and USD 1999/exponent 2 tested. Currency/exponent commerce policy and immutable version/publication write workflow remain future work.
- Public read surface: `/health`, `/ready`, product/offer list and ID reads, bounded pagination, hidden draft/archived records, no private delivery/version metadata. Mutations return 405; no operator API exists.
- Baseline security: Web Crypto UUIDv4 request IDs, parameterized SQL, controlled errors, security headers, logs without URL/query/payload/error text, ignored secrets/local state.
- Tests: 59 source/API/local-D1 tests + 5 repository safety tests + 5 compiled-Worker/workerd tests = **69 passed**. Typecheck and configured Prettier passed. `npm ci` successfully installed the locked dependency tree; npm audit returned zero known vulnerabilities.
- Build: `dist/_worker.js` approximately 30.24 kB plus routes/static assets. `npm test` builds first to ensure deployed-wrapper behavior is tested. The initial wrapper returned blank 200 for unknown routes; an explicit terminal 404 route and compiled-regression tests fixed this.
- Migration verification: local and remote migrations succeeded; reruns reported no pending migrations. Workerd tests begin with fresh D1 and verify readiness fails before schema exists, succeeds after migration, and fails after simulated schema failure.
- Local runtime: built Worker started through PM2/Wrangler on port 3000; health/readiness and persisted local product/offer fixtures verified. Browser status page loaded without console messages.
- BYOK resources: created new `tolvey-production` D1 and `webapp-3` Pages project. Existing unrelated projects/databases were not modified. Live foundation URL: https://webapp-3-38j.pages.dev
- Remote database: zero products, versions, and offers; FK check empty. No test fixtures were applied remotely. Live GET health/readiness/catalog/static endpoints passed; malformed ID 400, missing/unknown route 404, and POST/PUT/PATCH/DELETE 405 verified.
- Configuration boundary: preview APP_ENV=staging explicitly has no D1 binding and fails closed. Optional remote staging provisioning was denied by the account D1 quota; no existing database was deleted and production was not reused for staging.
- Toolchain note: initial npm 10 dependency resolver errors were resolved with npm 11 during installation; subsequent clean `npm ci` works with npm 10. The current Wrangler upstream dependency is Miniflare 5 alpha, pinned and tested using its exported legacy-config converter; do not upgrade without regression tests.
- Git delivery: commit/push/remote-SHA/clean-tree evidence belongs to the final session report after execution; this documentation does not manufacture that evidence.

Remaining outside Phase 1: remote staging provisioning (quota action), storefront/operator write controls when required, product content/validation, transactions, Duitku, fulfillment, distribution, analytics, commerce security hardening and production payment evidence. No production-commerce readiness is claimed.

Next major phase only after the entire Foundation Gate and Git delivery pass: **Phase 2 — Transaction Core**, with provider-neutral persistence/state/idempotency tests. Stop this session without implementing it.

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
- Lynk.id
- Gumroad
- Shopee where eligible
- TikTok Shop where eligible
- Etsy where eligible
- social discovery/content surfaces
- other compatible channels admitted by the distribution policy

Channel priority is an execution order, not a sales prediction. Product truth remains canonical in TOLVEY.

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
