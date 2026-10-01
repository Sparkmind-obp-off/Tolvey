# TOLVEY — Testing & Release

## Test layers
### Product
Validate product records, versions, offers, assets, pricing, delivery instructions, and publication state.

### Commerce
Validate checkout handoff, order creation, payment state, fulfillment, refunds, and customer-facing delivery.

### Distribution
Validate channel mappings, listing content, identifiers, pricing, availability, and import/export or adapter behavior.

### Security
Validate secret handling, access control, webhook validation, input validation, rate limiting, logging hygiene, and production/dev separation.

## Critical end-to-end test
Demand signal → Product → Offer → Storefront → Checkout → Order → Fulfillment → Customer receipt/use → Analytics.

## Release gates
A release is production-ready only when:
- tests pass;
- no critical security issue remains;
- production secrets are stored safely;
- rollback is defined;
- monitoring/logging is available;
- customer-facing copy is verified;
- payment and fulfillment paths are verified.

## Rollback
Rollback application behavior without deleting or corrupting transaction records. Preserve order, payment, fulfillment, and audit history needed for reconciliation.

## Phase 1 verification — 2026-09-30

The complete Foundation Gate is distinct from the later commerce production-ready release gate above.

Executed successfully:
- Clean locked dependency installation: `npm ci`.
- `npm run typecheck` and `npm run format:check` (Prettier; Markdown/SQL excluded, no separate lint configured).
- `npm test`: **69 passed**, with build executed by the pretest hook.
  - 59 tests for application/config/errors, canonical D1 schema/FKs/uniqueness/lifecycle/JSON/money, API visibility/pagination/validation, and mutation denial.
  - 5 tests for repository secret-ignore, environment separation, local-only seeds, and edge/runtime boundaries.
  - 5 tests for compiled Pages Worker running on workerd against fresh D1, migration/persistence/readiness, unknown-route 404, denied writes, and sanitized DB failures.
- `npm run build`: Worker approximately 30.24 kB plus static assets/routes.
- `npm run db:migrate:local` and `npm run db:migrate:production`: migration applied successfully; reruns reported no pending migrations. Remote FK check returned no violations and zero catalog records were confirmed.
- Local PM2/Wrangler startup, health/readiness, persistent local product/offer fixtures, and public CSS verified.
- Browser foundation page loaded without captured console messages.
- Live BYOK foundation: root/health/ready/catalog/CSS 200, malformed ID 400, missing/unknown route 404, and four mutation methods 405. Production catalogs are empty, not fabricated offers.
- npm audit: zero known vulnerabilities at verification time. Limited current-source/history/token pattern scan and Git integrity/diff checks are performed before final commit; final evidence is in the session report.

The initial build-wrapper 404 bug was found during deployed verification, fixed using an explicit terminal route, and covered by compiled workerd regression tests. Source-only API tests are insufficient to prove deployment behavior.

Not executed/implemented: checkout/payment/Duitku tests, commerce E2E, delivery/analytics tests, full security audit, recovery rehearsal, or controlled real customer transactions. Remote staging D1 provisioning failed due to account quota; preview intentionally has no DB and cannot share production. No optional staging readiness claim is made.

## Historical Phase 2 checkpoint verification — 2026-09-30

Status: complete checkpoint verification, **not complete Phase 2 gate**.

- `npm run check`: typecheck + configured Prettier + build + 109 passing tests.
- 69 existing Phase 1 tests remain unchanged/green; 40 added transaction tests exercise actual D1 and compiled workerd.
- Verified: atomic checkout/pending order/BLOCKED fulfillment/event creation, 12 concurrent retries with one winner, conflicting-key meaning, transient fault rollback/retry, preserved immutable snapshots, amount overflow/safe boundary/USD precision, foreign keys, state/status and unpaid-fulfillment guard, append-only/replay/event uniqueness, one live payment schema constraint, token/config/production denial, bounded bodies, generic errors and absent privileged transition routes.
- New migration 0002 applies as a local upgrade over existing Phase 1 catalog and in fresh credential-free local Wrangler state; reruns are no-ops; FK check returns empty. Migration 0001 is unchanged.
- Local runtime observed create 201, replay 200, protected pending-order read 200, unauthenticated 401, ready 200 with ephemeral ignored local credential. No real or simulated successful payment is claimed by those requests.
- Build approximately 39.81 kB; npm audit zero known vulnerabilities at verification time.

Missing at that historical checkpoint (superseded below): persistent full lifecycle, callback processing/idempotent confirmation, cancellation/expiry, failure/retry after payment, exactly-once operational fulfillment, refund flow, duplicate revenue under complete transition scenarios, and release/deployment identity gate. Schema-only test inserts are constraint tests, not provider confirmation or business evidence.

No new remote deployment/migration was performed. Production Phase 1 stays intact. Test credentials are ephemeral and never committed; final source/build/history/log hygiene and Git delivery evidence are recorded in the session report. Do not release this checkpoint as customer commerce.

## Phase 2 continuation verification — 2026-09-30

Executed: npm run check, 150 tests in five suites (69 foundation + 40 checkpoint + 41 lifecycle), typecheck/format/build (~40.05 kB), npm audit zero known vulnerabilities. Includes 12 concurrent initiations/confirmations, conflicting keys/events/reference reuse, monetary mismatches, cancelled/expired/terminal orders, failure/retry, cancellation/refund/completion races, immutable receipts, no duplicate confirmation event, eight injected audit-failure whole-batch rollback/retry paths. Exact-once internal record transitions are not exactly-once external delivery.

Lifecycle was additionally bundled into an in-memory test-only Worker and executed inside actual workerd with D1: confirmation concurrency, fulfillment fail/retry/complete and refund pending. The production Hono bundle omits the simulator and contains no lifecycle mutation routes. Production/staging simulator creation is rejected. PM2 built production-surface Worker returned health/ready 200, default internal API 503 and signal POST 405, without adding secrets.

Fresh/upgrade Wrangler local migrations passed; existing checkpoint order preserved; fresh/upgrade FK checks empty and reruns no-op. D1 API denied integrity_check, so local read-only SQLite checks returned ok instead. Migration 0001/0002 bytes unchanged. No remote database mutation/deploy. Git fsck passed; final source/history/build/log hygiene and clean pushed-main evidence belong to final report.

Phase 2 continuation gate is complete upon Git delivery; provider sandbox/real customer/payment/delivery/refund, public access/rate limits, canonical remote identity and recovery remain future gates. Phase 3 has not started.

## Foundation rollback guidance (not a rehearsed commerce rollback)

Redeploy a previously verified Pages artifact/commit compatible with the existing schema. Do not delete D1 or reverse migrations destructively to roll back an HTTP deployment. Phase 0 had no executable artifact, so it is not an application rollback target. This additive initial schema has no transaction records; future schema changes need compatible rollout and recovery plans. A rollback/recovery rehearsal remains required before commerce production validation.

## Operational rule
Prefer small, reversible releases. Ship the smallest change that proves or improves a real business workflow, then observe before expanding scope.

## Phase 3 local contract evidence — 2026-10-01

220 passing tests in six suites (150 prior + 70 POP), typecheck/format/build (~62.73 kB), npm audit zero known vulnerabilities. No separate lint tool is configured. Core schema/state/Phase 2 regression preserved, existing migrations unchanged. Tests cover canonical initiation, HMAC RFC4231/independent Node formulas, config failures/separation, strict request/response/form limits, money/reference/merchant/status mismatches, unknown/cancelled/expired/paid orders, 10 concurrent initiations (one outbound invoice), 12 duplicate callbacks (one confirmation), conflicts, unsigned-result tampering, status outage, transient canonical attachment recovery and audit rollback/retry. Logs/DTOs contain no test secret/raw SQL/body.

Compiled workerd harness strictly stubs provider HTTP and exercises actual Hono callback route: success/failure/duplicate 200 OK, bad signature 401, health/readiness 200. Stub routes/transport are in-memory test code, never public/deployed. Default PM2 runtime without secrets: callback/checkpoint 503, public initiation absent 405, return 200, health/ready 200.

Fresh/upgrade Wrangler local migration 0004 and checksum-preserved canonical records, rerun no-op, FK empty, offline read-only SQLite integrity ok. No remote migration/deploy. Limited source/build/history/log scan and final clean pushed-main evidence are in the session report, not a comprehensive security audit.

Evidence level: LOCAL CONTRACT TEST ONLY; SANDBOX CREDENTIALS NOT AVAILABLE. No rotated approved sandbox key was available; supplied chat/file credentials were not reused. Live POP creation/hosted payment/authenticated callback, common status API compatibility/acknowledgement and actual success/failure/duplicate end-to-end behavior must still pass before Phase 4. Production payment stays disabled.
