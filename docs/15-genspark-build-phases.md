# 15 — Genspark Build Phases & Session Strategy

## Current execution authority — system audit, 2026-10-01

This section supersedes conflicting **future execution order/session advice** below, not historical facts or unmet payment gates. Master full-cycle specification: [19](19-full-stack-system-architecture.md). Copyable session prompts: [16](16-master-system-prompt-genspark.md). Strategy remains docs/39 and docs/34.

### Audit scope and evidence

- Reviewed README and all **40 documents, 00–39**, against current routes/config, catalog/checkout snapshots, core factories/CAS/receipts, provider reservation/callback/connection boundaries, migrations and test coverage. This is a workflow/documentation audit, not a complete code-security or legal audit.
- Clean main baseline: `d73a4dfba04c8207f2b5f440e0052840cefdfc3d`. Phase 2 local gate delivery: `7a3b80163b6fd6e65271a4e9b6a00c363ffceb3c`; initial adapter delivery: `8a857ef84a91248de0dfa7525edcdc4203282345`.
- Prior implementation release: 237 tests/typecheck/format/build passed; actual production backend authentication verified, no invoice/payment. These are inherited timestamped results, not newly executed tests in this documentation audit.
- Read-only public curl checks on 2026-10-01 at approximately 11:24Z: `/health`, `/ready`, `/api/products`, `/api/offers` HTTP 200; both lists empty. Python urllib attempts failed with HTTPError; curl succeeded. Readiness is foundation/config readiness, not commerce readiness. No new authenticated provider call or Cloudflare resource inspection performed.
- No code/config/schema/test/dependency edits, secrets/DNS changes, remote migrations, deploy, invoice/payment or Phase 4 implementation authorized or performed here.

### Audit delivery validation

Executed in this documentation session: all 40 document IDs covered by disposition matrix; local Markdown/named-document references exist and fenced blocks balanced; `git diff --check`, `git fsck --no-dangling`, `npm run typecheck`, `npm run format:check`, `npm run build` (65.58 kB) and `npx vitest run tests/repository.test.ts` **5/5 passed**. Format check excludes historical Markdown; link/fence/diff checks supply the documentation validation. Full 237-test commerce/contract suite was **not rerun**, because runtime/config/schema/tests are unchanged. No new payment/network evidence substituted for missing live gate. Exact Git delivery/remote match is reported after push; no self-referential commit SHA inserted.

### Diagnosis: why progress felt slow

The bottleneck is **missing integration and business inputs**, not a need for another framework. The repository accumulated strong infrastructure/local safety proof while scopes deliberately excluded customer UI, publication, real assets, record ownership and actual delivery. Repeating old full-repo/provider audits cannot complete those missing capabilities.

Documentation also mixed historical snapshots with current state; treated offering tiers as business engines; made one phase sound like one session; repeated Phase 2 prompts after completion; and deferred important operations/security to late phases. These were documentation/execution defects, not evidence that existing core code is worthless.

### Prioritized gap / dependency matrix

| ID / priority | Actual gap and source | Required action / owner | Acceptance gate |
| --- | --- | --- | --- |
| G01 / P0 | No real public launch product/offer; catalog read-only and live lists empty | Founder supplies/approves buyer, package, price, license and terms; product creator QA | Working master package, honest launch brief; hypothesis not called validated |
| G02 / P0 | No controlled publication workflow; docs35 schema is not D1 schema | Engineer: draft/review/publish service and smallest operator action | Unauthorized writes denied, active parents/package checks, audited activation/rollback to unpublished |
| G03 / P0 | Public root status page; no consuming storefront/product UI | Engineer: SSR product page, mobile/error/empty states and honest CTA | Published persisted product/offer rendered; draft/private fields hidden |
| G04 / P0 | Internal single-service token/idempotency is not customer auth | Engineer: scoped guest session, ownership, contact/policy retention, CSRF/abuse/recovery | Customer A cannot read/initiate/download B; no order UUID/email-only authorization; same-principal retries safe |
| G05 / P0 | Production connection ≠ hosted sandbox transaction; core/gateway/env/schema reject execution | Engineer + owner/provider: isolated real sandbox target, narrow initiation and additive release design | Real invoice/payment/callback/status/replay/failure evidence; no spoofed local env, production DB or stub substitute |
| G06 / P0 | delivery_reference and fulfillment states do not deliver bytes or services | Engineer + creator: pinned asset manifest, private R2, payment-gated access/retry | Purchased version retained, unauthorized/unpaid/expired grants denied; retrieval evidence separate from customer use |
| G07 / P0 | RESERVED ambiguity/missing callback/late payment have no full operator resolution flow | Engineer + operator: durable exceptions, reconciliation/status evidence and safe actions | Timeout/replay/late-paid case visible, assigned and recoverable; no blind recreate/force-paid |
| G08 / P0 | Rate limits, operational alerts/recovery rehearsal/customer policies not launch-complete | Engineer + owner: baseline controls with checkout; incident/recovery and support runbooks | Abuse denied, paid-delivery failure visible, non-prod recovery rehearsed, disable-new-checkout preserves truth |
| G09 / P0 release | Remote transaction migration, key rotation, production service facade and controlled payment not done | Separate authorized release session; engineer + owner | Additive migration/fresh/upgrade, compatible rollback, real authorized payment/delivery evidence; preserve guard defaults until approved |
| G10 / P1 | Service model only conceptual; current fulfillment creation DIGITAL | Founder/operator: one scoped service inquiry; engineer: inquiry/acceptance path when needed | Scope/capacity/revisions/input/timeline/handoff defined; inquiry not counted as sale or delivery |
| G11 / P1 | Channel/source string ≠ external-order normalization or verified attribution | Engineer/operator: one approved manual channel + unique external-origin intake | One canonical version/listing mapping, duplicate imports safe, verified source evidence; no fake own checkout |
| G12 / P1 | Commercial funnel/economics specified, no implemented report | Engineer/operator: minimum read view/aggregates and experiment log | Tests excluded, distinct confirmed/fulfilled counts, known fees/costs vs unknown, no fabricated profit |
| G13 / P1 | Brand/personal content and ads need offer destination, owner and budget | Founder: one primary channel, real demo/content/link, permitted promotion | Qualified signals recorded; ads only with explicit spend cap and working delivery/economics |
| G14 / P1 release | Preview has no DB, old quota/domain evidence not freshly verified | Owner/engineer: verify isolated resource capacity and identity before release | Never share production or delete unrelated DB; intended domain only attached under explicit DNS scope |
| G15 / P2 | Catalog/tool/channel/automation breadth outruns evidence | Defer advanced admin, all channels, bundles, affiliates, extra providers | Repeated measured problem or customer evidence justifies addition |

P0 means a blocker **for the capability/launch that depends on it**, not that every read-only page waits for all P0 items. Engineering owns implementation; founder approval of real product/legal promises and provider/account/payment access cannot be manufactured.

### Updated gate dependency map (same phases 0–8)

| Phase | Current state / purpose | Complete gate / dependencies |
| --- | --- | --- |
| 0 Audit | Original audit delivered; this full-system enhancement is documentation-only | Reconciled workflow/gaps/prompts and Git delivery; not commerce proof |
| 1 Foundation | Delivered | Preserve deployed runtime/catalog, safe defaults and tests |
| 2 Transaction Core | Delivered local/test | Preserve provider-neutral lifecycle; do not restart or imply production APIs |
| 3 Duitku POP | Code/local contract + production connection delivered; live full-payment gate incomplete | Supported isolated deployed sandbox, private initiation, real invoice/payment/callback/common-status/replay/failure/reconciliation. If sandbox route cannot be supplied, record blocker; any alternative controlled production verification needs a separate explicitly approved gate revision, never silent substitution |
| 4 Product-to-Commerce | Not implemented | One package/version/offer → authorized publication → customer page/access/checkout → verified provider signal → private fulfillment → support/visible evidence in non-production; depends on Phase 3 for provider E2E. Launch-critical Phase 6 controls included |
| 5 Distribution | Planned | One eligible external commerce path from same version, channel policy/economics, unique verified external evidence; manual first. May pilot independently if fulfillment and account gates pass |
| 6 Security/Observability | Baseline already partial, deeper operations planned | Baseline ownership/rate limits/exception visibility/recovery required before checkout launch; deeper dashboard/alerts follow real load. Not a reason to defer baseline to after distribution |
| 7 Production Validation | Not passed | Phase 3 live + Phase 4 integrated + baseline security/recovery; separately authorized production schema/gateway/secrets and controlled real payment/delivery/reconcile. Does not depend on all Phase 5 channels or advanced Phase 6 dashboard |
| 8 Optimization | Deferred | Measured repeatable work/economics, then targeted automation |

Independent business work (real product QA, scope, content, channel-policy review) and authorized read-only UI work can proceed while provider verification is blocked. This is **not permission to skip Phase 3 or execute Phase 4 now**. Phase 4 integrated payment gate still waits. Phase 7 precedes broad launch/paid scaling; the phase numbers classify scope, not a strictly linear schedule for independent tasks.

### Next authorized-build recommendation and session-sized outputs

**Next objective: one launch candidate + controlled catalog publication consumed by a customer product page.** This is a proposed next session, not code delivered by this audit. Do not start another provider-debug session by default. If actual facts/assets are absent, implement reusable local/test publication/page behavior with clearly labeled fixture; keep production catalog and paid CTA unchanged and report missing inputs.

| Bounded session objective | Coherent output, not public phase subdivision | Exit proof |
| --- | --- | --- |
| Product/publication to page | Real/approved launch brief plus persisted draft/review/active offer and actual product detail UI | Hidden drafts, denied writes, terms/content, safe DTO, mobile/error checks |
| Provider live gate continuation | Separately track actual Phase 3 environment/private initiation/status/callback/recovery | Real sandbox evidence, exact blockers if absent; no repeated empty-auth probe sold as progress |
| Customer checkout to pending order | Guest ownership/contact/policy, authoritative summary, idempotent creation/status UI | Compiled create/replay/conflict/other-customer denial, abuse/expiry/recovery |
| Confirmed payment to private access | Entitlements, pinned R2 version, fulfillment/failed-delivery view | Unpaid/other-customer denial; duplicate signal/grant safe; missing asset/retry |
| Operator resolution and release candidate | Order/exceptions read view, safe actions, support/refund/restore rehearsal | One full non-prod loop plus failure/recovery; all baseline launch gates checked |
| Controlled production validation | Only separately authorized Phase 7 scope | Real payment/delivery/reconcile, source/migration evidence and honest limitations |
| One external channel + demand loop | Manual policy-admitted listing/content, external intake/metrics when authorized | Canonical mapping, verified evidence/duplicates, weekly learning |

These objectives can combine or span sessions according to actual complexity. No fabricated credit estimate or promise of guaranteed revenue. No elaborate login/cart/dashboard/library prerequisite when a narrow secure session, one offer and small operator view suffice.

### Document coverage / disposition — all 40 reviewed

| Doc | Disposition and audit conclusion |
| --- | --- |
| 00 | Updated authority/read order/current gates; no 40-document reread per normal session |
| 01 | Retain brand/no-marketplace principles; no implementation conflict |
| 02 | Retain Offer authority/catalog rules; planned wider metadata remains specification |
| 03 | Retain neutral commerce; detailed branch/recovery gaps now specified in 19 |
| 04 | Retain channel/canonical principles; admission evidence now 32/19 |
| 05 | Retain Money Kit hypothesis; remove compulsory Money Kit choice elsewhere |
| 06 | Rewrite minimal coherent launch scope and separate preparation/release proof |
| 07 | Current production-connection overlay; old sandbox restrictions labeled historical; baseline launch checklist |
| 08 | Retain evidence discipline; operational funnel definitions now 27/19 |
| 09 | Add decisions D008–D011: connection limit, terminology, dependencies and session contract |
| 10 | Specify publication/support/reconciliation/refund/recovery operator cycle |
| 11 | Label Phase 1 snapshot historical; direct current boundaries to 19/21 |
| 12 | Current 237 release overlay; add differentiated acceptance/recovery matrix; retain historical counts |
| 13 | Retain local core contract; current boundary overlay prevents simulation/delivery confusion |
| 14 | Preserve provider attempt history, correct current final deployment/source stamp and limits |
| 15 | This audit/gap/dependency/backlog authority; retain old evidence as history |
| 16 | Replace broad repeated-audit prompt with bounded implement/verify/handoff and copyable next prompt |
| 17 | Retain PRD, specify minimal cross-engine launch acceptance and service separation |
| 18 | Retain design system; add scoped launch surfaces instead of giant operator inventory |
| 19 | Master workflow, three paths, data/runtime choices, exceptions, official research |
| 20 | Clarify actual status, scoped guest UI/recovery, CSP/form and compiled test requirements |
| 21 | Current overlay + planned capability/security contract; existing routes not renamed as public APIs |
| 22 | Current schema boundary + proposed assets/session/external models explicitly unimplemented |
| 23 | Reconcile historical no-provider text with deployed connection; retain neutral adapter contract |
| 24 | Reconcile candidate automation wording; reliability controls are required, growth automation deferred |
| 25 | Current existing-project source/URL; old Foundation identity evidence historical; domain/staging not solved |
| 26 | Current honest presentation evidence; remove misleading absence of production connection integration |
| 27 | Replace stale next-Phase-2 status, add metrics denominators/economics/test exclusion |
| 28 | Archive completed Phase 2 prompt, not active restart instruction |
| 29 | Offering tier terminology clarified; catalog size not evidence |
| 30 | Explicit idea inventory, not launch commitment/actual records; one candidate first |
| 31 | Retain optional free funnel; a free lead magnet is not required before a paid candidate |
| 32 | Distinguish demand vs commerce, current Indonesia TikTok virtual/service policy; eligibility not assumed |
| 33 | Service inquiry/acceptance/milestones; DIGITAL placeholder not service implementation |
| 34 | Current connection/full-gate distinction and engines vs tiers |
| 35 | Commercial record specification ≠ implemented schema; operational mapping/price authority |
| 36 | Separate product launch gates from engineering/payment/release gates; listing ≠ sale |
| 37 | Retain truthful listing standard; policy gate reinforced by 32/38 |
| 38 | Manual channel intake/unique external IDs/verification/cost evidence/unknown attribution |
| 39 | Preserve vision, correct ambiguous layer labels/current connection status and replace orphan citations |

Research sources and constraints reviewed 2026-10-01 are linked in docs/19 §10 and docs/32. Decisions/gaps are recommendations/specification, not implementation proof. Scope deliberately excludes a full legal/privacy compliance determination or provider/account admission.

## Objective (historical plan context)
Build TOLVEY as a production-oriented Product House Hub + Commerce House Hub, preserving the Cloudflare-compatible architecture.

One phase is one gate; one working session is one bounded objective. They are not one-to-one. The historical evidence below remains a record of its dated scope; read the current section above before selecting future work.

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

### Phase 3 credential-environment correction — 2026-10-01

User clarified that supplied credentials are production and authorized direct production connection checks. Current production authentication evidence: correct POP signature with empty body → HTTP 400 required amount validation; altered-signature negative control → HTTP 401 Unauthorized; common read-only status query for nonexistent order → HTTP 404 transaction not found. Official production contracts/source HMAC matched. This supersedes the blanket credential/project-blocked conclusion: earlier merchant-not-found applies to sandbox only. See docs/14 for UTC times and sources.

Current status: **PRODUCTION CREDENTIAL AUTHENTICATION VERIFIED — PAYMENT / DEPLOYMENT UNVERIFIED**. No invoice/payment/callback, remote mutation, secret installation or deploy occurred. Runtime remains sandbox-only; local/test guards are not bypassed. Original sandbox end-to-end gate remains incomplete, and any production runtime/payment activation needs a reviewed release scope rather than treating auth probes as payment success. Key exposed in chat should be rotated before activation. **Phase 4 NOT AUTHORIZED / not started.**

### Phase 3 production connection implementation/deploy — 2026-10-01

Latest user explicitly requested implementation, secure secret storage and CF BYOK deployment rather than more documentation-only checks. Delivered bounded production connection release: matching-environment config/official endpoint selection, private operator-authenticated non-creating connection check, actual-provider response parsing and native global fetch receiver fixes, Cloudflare Pages production secrets installed from uploaded execution file/stdin, real deployment to existing `webapp-3`. Deployed Worker connection returned HTTP 200 authentication verified; health/readiness/catalog/return 200, unauthenticated check 401, production callback/checkpoint 503. Exact URL, final regression/security and committed-main delivery: docs/14/session report.

**DEPLOYED — PRODUCTION CONNECTION VERIFIED**, not a paid transaction or complete original sandbox end-to-end gate. Transaction execution remains closed; immutable migrations/core untouched, no remote transaction migrations/fixtures, no DB/frontend credentials, no DNS/new-project change. Provider/operator keys are Cloudflare Secrets; rotate chat-exposed provider key before real payments. Brand/distribution architecture not changed. **Phase 4 NOT STARTED.**

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
