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

## Foundation rollback guidance (not a rehearsed commerce rollback)

Redeploy a previously verified Pages artifact/commit compatible with the existing schema. Do not delete D1 or reverse migrations destructively to roll back an HTTP deployment. Phase 0 had no executable artifact, so it is not an application rollback target. This additive initial schema has no transaction records; future schema changes need compatible rollout and recovery plans. A rollback/recovery rehearsal remains required before commerce production validation.

## Operational rule
Prefer small, reversible releases. Ship the smallest change that proves or improves a real business workflow, then observe before expanding scope.
