# 15 — Genspark Build Phases & Session Strategy

## Objective
Build TOLVEY as a production-oriented Product House Hub + Commerce House Hub, using Genspark as an implementation environment while preserving a Cloudflare-compatible production architecture.

The build is divided into gated phases. One phase should normally be one focused Genspark session. Do not burn a large session trying to build the entire system blindly.

## Strategic North Star — Mandatory Context

Before making implementation decisions, read `docs/39-vision-mission-north-star.md`.

TOLVEY has three connected business engines:

1. **Own Commerce:** TOLVEY's own shop is the canonical owned commerce destination, including catalog, product pages, checkout, payment, order and fulfillment.
2. **Distribution:** external commerce platforms provide additional reach and optional checkout paths. Their listings are derived from TOLVEY's canonical product truth.
3. **Brand / Demand:** social, content and search channels create awareness, demand signals and traffic that may route customers to either TOLVEY or an approved external commerce channel.

The architectural principle is **ONE PRODUCT, MANY DOORS**.

The commercial loop is:

`Demand → Product → Offer → Publish → Distribute → Sell → Deliver → Measure → Learn → Improve`

Do not build multi-vendor marketplace infrastructure or duplicate product truth per channel. Brand/demand work is continuous business activity and does not need to wait for engineering phases to finish.

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

### Historical Phase 2 execution checkpoint — 2026-09-30

Status at that checkpoint: **in progress**, not Phase 2 completion. Superseded by the continuation evidence below. There are no externally named subdivisions.

Purpose: preserve the audited Phase 1 runtime and latest commercial architecture while establishing durable atomic checkout/pending-order truth and a controlled non-production read/write boundary.

Implemented/verified:
- New migration 0002: CheckoutSession, Order, Payment, Fulfillment, append-only events, immutable snapshot/version barriers, FK/money/state/unique/index constraints.
- One atomic checkout/order/blocked-fulfillment/audit creation batch, server-authoritative price/currency at write time, SHA-256 idempotency/request fingerprints, safe replay/conflict behavior.
- Provider-neutral adapter interface/state graph; no provider or privileged state-transition HTTP implementation.
- Feature-flagged internal checkout/order API with private service bearer credential, request/body/input constraints and generic errors. Production is explicitly disabled; no customer auth/public checkout is claimed.
- 109 tests passed: unchanged 69 Phase 1 + 40 real D1/workerd checkpoint tests. Includes 12 concurrent same-key requests, conflicting payload concurrency, fault/rollback/retry, snapshots, schema dedup/FKs/integer precision, protected compiled APIs, and invalid states.
- Typecheck/format/build passed (Worker approximately 39.81 kB). Local upgrade/fresh Wrangler migration and reruns passed; FK check empty. Local runtime create 201, replay 200, pending-order read 200, unauthorized 401 observed with an ephemeral ignored local credential. No confirmed payment or completed delivery created.
- Read-only Pages audit: existing `webapp-3`/`webapp-3-38j.pages.dev`, main, Phase 1 commit efd5d7d; production DB, no preview DB. `tolvey` absent in this account (404), global availability not proven. Existing deployment, remote schema, bindings, secrets and DNS unchanged.

Remaining mandatory Phase 2 work: payment initiation/signal processing, complete atomic cross-entity transitions, expiry/cancellation, fulfillment authorization/retry/completion, refund operations, test-provider full lifecycle, callback/revenue/concurrent-transition/failure regressions, production release and canonical identity handling. Timestamp/enum/uniqueness constraints do not prove those services exist. Schema supports them; no success is fabricated.

Next bounded execution session remains **PHASE 2**: implement atomic provider-neutral payment transition/orchestration with expected-reference/amount checks, idempotency and concurrency tests plus expiry/cancellation handling. Do not implement Duitku or real delivery. Release/deploy only after the appropriate gate review; do not attach production D1 to preview or create another unrelated Pages project.

Git commit/push/clean-state evidence is reported after execution in the final session report. This checkpoint is not an authorization to enter Phase 3.

### Phase 2 continuation evidence — 2026-09-30

Status: **COMPLETE under the latest explicit local/test continuation gate**, subject to clean commit/push/matching-main evidence in the final session report. The newer command does not require remote deployment and forbids production transaction APIs. This closes the single Phase 2, not a new named phase.

Baseline d0c7b5a; migration 0003 adds revision CAS, immutable operation/key/replay ledgers, payment identity/confirmation and terminal-state guards; 0001/0002 unchanged. Internal local/test simulation core implements payment initiation, exact reference/money confirmation/failure, expiry/cancel, fulfillment authorize/complete/fail/retry and refund request only. All state/event writes occur in one owned D1 batch; matching receipts replay without reopening state. No actual delivery/refund/payment/provider signal authenticity is claimed.

Verification: 150 tests (69 foundation, 40 checkpoint, 41 lifecycle), typecheck/format/build (~40.05 kB), 12 concurrent initiations/confirmations, event/key conflicts, terminal/money/reference mismatches, cancellation and fulfillment/refund races, eight audit-fault rollback/retry paths, compiled in-memory lifecycle Worker execution, fresh/upgrade migrations with an existing checkpoint order, rerun no-op, FK empty and local read-only SQLite integrity ok. D1 API disallows integrity_check; offline local SQLite supplied that evidence. npm audit zero known vulnerabilities. PM2 built Worker: health/ready 200, default internal API 503, signal POST 405.

Production and desired identity remain unchanged as documented in docs/25. No secret was introduced or supplied provider credential used; no new lifecycle HTTP endpoints. Future remote release, provider authenticity, actual delivery/refund, staging quota, canonical DNS identity and commerce recovery are outside this continuation gate, not accomplished business evidence. Do not enter Phase 3 without a separate explicit request.

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

### Phase 3 execution evidence — 2026-10-01

Latest explicit command authorizes Phase 3 only and forbids production deployment/Phase 4. Baseline main `7a3b80163b6fd6e65271a4e9b6a00c363ffceb3c` confirmed clean/matching remote. Phase 2 remains complete, not restarted.

Status: CODE COMPLETE / SANDBOX BLOCKED, with final Git delivery evidenced by report/history. 220 tests including 70 POP contract tests, typecheck/format/build (~62.73 kB), fresh/upgrade migration 0004, immutable 0001–0003, preserved canonical records, FK/integrity and compiled workerd callback success/failure/duplicate/invalid behavior verified using strict stubs. Adapter/config/gateway/provider audit/minimum callback and neutral return implemented; no new dependencies, no production payment or actual delivery.

Current official HMAC formulas used, not obsolete SDK signatures. Unsigned callback status/reference require extra common status API verification; actual POP-project interoperability must be proven live. Credential shared through chat/upload is not reused/read; no rotated approved runtime key is available. Evidence is LOCAL CONTRACT TEST ONLY, never DUITKU SANDBOX VERIFIED.

Next session remains Phase 3: rotated sandbox secrets, approved reachable non-production HTTPS callback/return origin and isolated DB, then live POP payment/callback/status/retry evidence. Keep production disabled and preserve deployment identity. No Phase 4 authorization until the live gate is satisfied.

### Phase 3 live execution attempt — 2026-10-01

Latest explicit command now authorizes secure uploaded-file consumption and owner-account BYOK deployment **after sandbox credential validation**. Remains the same Phase 3; no Phase 4 implementation.

Baseline main `5c515ffc8c5e27a0e2049aa5ba765392b3913f3e`; strategic docs 39/34 and current implementation reviewed. Input names detected and values parsed only in memory; no explicit sandbox marker. Real official sandbox-only status probe returned HTTP 404; POP signed empty-body authentication probes returned HTTP 400 classified **merchant not found**, independently confirmed via urllib and curl. No raw secrets/signatures/provider bodies exposed; no invoice/payment/callback/state transition claimed. Authentication success was not proven; no legacy-signature fallback or production provider request.

Primary status: **SANDBOX VERIFICATION BLOCKED**. Provider-secret installation and requested new BYOK deployment were not performed because the precondition failed. Owner Cloudflare authentication/project/deployment inventory succeeded; existing `webapp-3` foundation remains unchanged. Curl health/readiness/catalog HTTP 200 does not constitute a Phase 3 redeploy or commerce verification. Isolated deployed sandbox environment/private initiation/fulfillment-authorization integration remain technical gaps, not falsely claimed implemented.

Full timestamped attempt, secret-name contract, regression/security delivery results and unblock actions are in `docs/14-duitku-pop-integration.md`. Uploaded key still requires rotation after chat exposure; confirm an active sandbox project and matching key through a secure channel. **Phase 4 NOT AUTHORIZED.**

### Phase 3 direct file execution — 2026-10-01

Latest request requires uploaded file → read/parse → real provider request → validated secrets/deploy → live verification. First action searched user uploads; latest attachment was read and USED, not substituted or rejected because of its filename/missing environment marker. Baseline main `c923f5268b5c195379b9e8102fc164a5c5755660`; file bytes match preceding upload. Real official POP sandbox probes returned HTTP 400 merchant not found, including official lowercase path signed by existing source HMAC. Official endpoint/headers/timestamp/formula rechecked; no signature/endpoint defect demonstrated. Provider project authentication remains unproven.

Primary status under the newest request: **DUITKU CREDENTIAL / PROJECT BLOCKED**. Current regression: 220/220 tests, typecheck/format/build pass; no runtime/schema/dependency change. Standalone gateway diagnostic stopped during isolated D1 startup and is not full-order evidence. Provider acceptance precondition failed, so secrets/new BYOK deploy/live callback NOT performed. Full direct-execution evidence, limitations, security scans and Git delivery are in docs/14. Resolve active sandbox project/matching rotated key through secure input before continuing the same Phase 3. **Phase 4 NOT AUTHORIZED / not started.**

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
