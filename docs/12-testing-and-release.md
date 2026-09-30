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

## Phase 2 checkpoint verification — 2026-09-30

Status: complete checkpoint verification, **not complete Phase 2 gate**.

- `npm run check`: typecheck + configured Prettier + build + 109 passing tests.
- 69 existing Phase 1 tests remain unchanged/green; 40 added transaction tests exercise actual D1 and compiled workerd.
- Verified: atomic checkout/pending order/BLOCKED fulfillment/event creation, 12 concurrent retries with one winner, conflicting-key meaning, transient fault rollback/retry, preserved immutable snapshots, amount overflow/safe boundary/USD precision, foreign keys, state/status and unpaid-fulfillment guard, append-only/replay/event uniqueness, one live payment schema constraint, token/config/production denial, bounded bodies, generic errors and absent privileged transition routes.
- New migration 0002 applies as a local upgrade over existing Phase 1 catalog and in fresh credential-free local Wrangler state; reruns are no-ops; FK check returns empty. Migration 0001 is unchanged.
- Local runtime observed create 201, replay 200, protected pending-order read 200, unauthenticated 401, ready 200 with ephemeral ignored local credential. No real or simulated successful payment is claimed by those requests.
- Build approximately 39.81 kB; npm audit zero known vulnerabilities at verification time.

Missing required Phase 2 verification: persistent full lifecycle, callback processing/idempotent confirmation, cancellation/expiry, failure/retry after payment, exactly-once operational fulfillment, refund flow, duplicate revenue under complete transition scenarios, and release/deployment identity gate. Schema-only test inserts are constraint tests, not provider confirmation or business evidence.

No new remote deployment/migration was performed. Production Phase 1 stays intact. Test credentials are ephemeral and never committed; final source/build/history/log hygiene and Git delivery evidence are recorded in the session report. Do not release this checkpoint as customer commerce.

## Foundation rollback guidance (not a rehearsed commerce rollback)

Redeploy a previously verified Pages artifact/commit compatible with the existing schema. Do not delete D1 or reverse migrations destructively to roll back an HTTP deployment. Phase 0 had no executable artifact, so it is not an application rollback target. This additive initial schema has no transaction records; future schema changes need compatible rollout and recovery plans. A rollback/recovery rehearsal remains required before commerce production validation.

## Operational rule
Prefer small, reversible releases. Ship the smallest change that proves or improves a real business workflow, then observe before expanding scope.
