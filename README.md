# TOLVEY

**Product House Hub + Commerce House Hub** for TOLVEY-owned products, initially serving Indonesia. V1 is not a multi-vendor marketplace. Money Kit remains a hypothesis, not evidence of demand or a validated commercial offer.

One canonical product source → many distribution channels → one normalized transaction model → one operational truth.

## Current delivery — PHASE 2 — TRANSACTION CORE

**COMPLETE within the latest continuation gate: provider-neutral local/test transaction core.** Git delivery (commit, push, matching remote SHA, clean tree) is evidenced by the final session report and repository history. No Phase 3 work is authorized or started. Technical simulation is not production commerce readiness.

Baseline: `d0c7b5a03584daa51f4b5b27a18410fc04e98b73` on `main`. Existing foundation and checkpoint work were preserved, not recreated.

### Implemented and locally verified

- Canonical Product/ProductVersion/Offer in D1, active-only read APIs and Hono/TypeScript/Cloudflare Pages Worker.
- Atomic checkout, immutable commercial snapshots, pending order, one BLOCKED fulfillment and creation audit. No payment is invented during checkout.
- Provider-neutral payment attempt persisted with UUID, adapter key/reference, canonical order money, initiation timestamp and hashed idempotency identity.
- Trusted **internal simulation** confirmation/failure processing validates order/payable state, payment/provider/transaction references, exact integer amount, currency/exponent and expiry. Never accepts browser success.
- Atomic cross-entity lifecycle via D1 batch, revision compare-and-swap, durable immutable operation receipts, signal identity dedup and hashed retry-key aliases. Changed meaning conflicts; identical replay cannot reopen old states.
- Explicit idempotent expiry/cancellation synchronizes session/order/pending payment and fulfillment where applicable. Late payments are rejected even before an expiry sweep.
- Fulfillment authorization, simulated completion, failure and safe retry reuse the original fulfillment row. No delivery side effects occur.
- Refund **request only**: REFUND_PENDING, preserves original payment identity/money/confirmation. No refund completion operation or claim of money returned.
- Append-only events/receipts/replay audits, FK/money/state/uniqueness/identity guards; migration 0003 is additive. Migrations 0001/0002 are unchanged.
- **150 passing tests**: 69 foundation + 40 checkpoint + 41 lifecycle. Typecheck/format/build pass; Worker ~40.05 kB. Fresh/upgrade migrations, rollback/retry, concurrency, compiled workerd lifecycle and FK/integrity checks pass. npm audit: zero known vulnerabilities at verification.

### Internal lifecycle contract (not HTTP)

`src/transaction-lifecycle.ts` exports `createSimulationCore(db, environment)`; environment is trusted configuration, never a request field. Only `local`/`test` are accepted; staging/production fail closed. It is not imported by the production Hono entry and is absent from the deployed application bundle. The test-only Worker harness is bundled in memory, never deployed.

Methods:
- `initiatePayment(orderId, {provider, provider_reference}, context)` — no client money/status inputs; SQL copies canonical money.
- `processSignal(orderId, signal, context)` — normalized internal simulated CONFIRMED/FAILED signals only, not a provider callback. `VerifiedPaymentSignal` is a shape, **not proof of authentication**.
- `expireOrder`, `cancelOrder`, `authorizeFulfillment`, `completeFulfillment`, `failFulfillment`, `requestRefund` — `(orderId, context)`.
- Context: `{ key, request_id, now? }`; key uses existing 16–128 ASCII policy; request ID is UUIDv4. UTC clock override is trusted local/test tooling only.
- Result: `{ receipt, replayed }`. Receipt is the original immutable operation outcome, not a promise of current state. Obtain current state via protected order read. New authorization key is required after fulfillment failure; replaying an old authorization does not retry it.
- Identical operations replay, conflicting fingerprints return 409. Concurrent different commands may reject `CONCURRENT_TRANSITION` (409); re-read state before deciding whether to retry. Terminal states cannot reopen. Repeated expiry/cancel/refund with new keys replay the original operation. New signal IDs after confirmation are terminal conflicts, not extra confirmations.

Before real provider use, Phase 3 must supply a reviewed authenticated adapter/gateway, verified provider/merchant context and clocks. Do not enable simulation in production or expose this factory to browser input.

### Existing protected checkout API

Disabled by default; production explicitly rejected even with enabled flag/token. One private internal service principal, **not** customer auth, tenant ownership, public admin API or Hosted admission rules.

Non-production checkpoint access requires D1, explicit APP_ENV, `TRANSACTION_CORE_ENABLED=true`, private `TRANSACTION_CORE_TOKEN` (32–256 chars) and server-only bearer authorization. Do not create or put tokens in customer browser code.

- POST `/api/transaction-core/checkouts`: bounded 2048-byte JSON, only UUID `offer_id`, quantity 1–100, source label and optional opaque UUID customer reference. `Idempotency-Key` required. Create 201; matching replay 200; conflicting meaning 409.
- GET `/api/transaction-core/checkouts/:id` and `/api/transaction-core/orders/:id`: protected safe DTOs omit private delivery/customer reference and keys/hashes.
- Disabled/production 503; unauthorized 401; malformed 400; unavailable/missing 404; oversized 413; unexpected error generic 500. Errors include request ID, never SQL/credentials.
- No payment/signal/refund/fulfillment mutation HTTP routes. Other writes remain 405. Flag-enabled readiness now requires all three transaction migrations.

## Deployment status / URLs

- Repository: https://github.com/Sparkmind-obp-off/Tolvey — `main`.
- **Existing production is Phase 1 only:** https://webapp-3-38j.pages.dev at source `efd5d7d8408646f04e0a72afd52849ba6b550a07`.
- No remote migration/deploy/secrets/DNS/resource changes in this continuation. No production transaction API enablement.
- Desired `tolvey.pages.dev` / business domain `tolvey.biz.id` are not achieved here. Earlier account audit found project `tolvey` absent in this account; global hostname availability was not proven. Preserve existing project until deliberate release/identity review (docs/25).
- Preview/staging has no DB binding due earlier account quota; never attach production D1 to preview or delete unrelated resources.
- Sandbox port 3000 is temporary local verification, not production.

## Public foundation routes

| Route | Behavior |
| --- | --- |
| GET `/` | Honest foundation status, no purchasing |
| GET `/health` | Liveness 200, still identifies deployed surface as foundation |
| GET `/ready` | Catalog readiness; additional transaction schema probe if enabled |
| GET `/api/products?limit=20&after=<UUID>` | Active products, limit 1–50/keyset pagination |
| GET `/api/products/:id` | UUIDv4 validation; malformed 400, hidden/missing 404 |
| GET `/api/offers?limit=20&after=<UUID>` | Active offer/product/version only |
| GET `/api/offers/:id` | Public DTO; no private delivery/version data |
| GET `/static/style.css` | Static styling |

Collections: `{data: [], next_cursor: null}`. Singles: `{data: {...}}`. Unknown routes JSON 404; other mutations 405 except the protected checkpoint create route; bodyless HEAD and OPTIONS 204. No permissive CORS.

## Data and money

D1 persists products, product_versions, offers, checkout_sessions, orders, payments, fulfillments, transaction_events and migration-0003 operation/key/replay ledgers. No runtime in-memory/file persistence.

Offer owns price. Nonnegative integer minor units ≤ Number.MAX_SAFE_INTEGER, explicit uppercase currency and exponent. Exact BigInt-derived multiplication bound; SQL copies purchase/payment money. Test fixture: 20000 IDR/exponent 0; not a sellable production product. Purchase snapshots and referenced version content stay immutable after checkout; future offer price/name edits cannot rewrite orders. Private delivery reference is opaque configuration, not a signed URL or actual delivery implementation.

Expiry lifetime: 30 minutes, immutable. Expiry is an explicit core operation, not a scheduled job; initiation/signals always enforce the deadline. Payment failure closes the checkout as CANCELLED, while order/payment remain FAILED and fulfillment BLOCKED. Expiry keeps unpaid fulfillment BLOCKED; cancellation makes it CANCELLED. Refund cancels a pending fulfillment, preserves already FULFILLED/FAILED history and never erases confirmation.

## Local development / verification

Node ≥22.12; dependencies locked. All code resides in `/home/user/webapp`.

```sh
npm ci
npm run build
npm run db:migrate:local
npm run check
# Optional local TEST fixture only, never remote:
npm run db:seed:local
# Sandbox daemon, build first; free port 3000 before restarting:
pm2 start ecosystem.config.cjs
curl http://localhost:3000/health
curl http://localhost:3000/ready
pm2 logs tolvey --nostream
```

`npm test` builds first. Tests create isolated real D1/workerd; no remote DB or real payment credential is used. Formatting excludes historical Markdown/SQL; SQL is validated by migrations/runtime tests. PM2 is tooling only; deployed code uses Web APIs, no Node runtime imports or compatibility flag.

Fresh migration verification used isolated `.wrangler/phase2-lifecycle-fresh`; upgrade preserved an existing checkpoint order. Reruns report no pending migrations. FK checks empty; read-only SQLite integrity checks returned `ok`. D1 API disallows integrity_check (SQLITE_AUTH), so the integrity check was performed on local SQLite only. No destructive rollback: injected audit failures prove batch rollback; recovery for real production commerce is still future work.

Secrets/local databases/build/logs are ignored. No supplied payment credential was read, copied, stored, logged or used in this phase. Limited pattern/history hygiene and npm audit are not a complete security audit. Rotate any credential shared in chat before later provider work; do not send replacement secrets in chat.

## Remaining outside Phase 2 / next steps

- Phase 3 is **not started**: official provider specification review, sandbox adapter authenticity/merchant checks, provider-side idempotency/reconciliation and authenticated callback gateway.
- Real product validation/assets, actual delivery, public customer checkout, rate limits/record authorization, operator/dashboard, distribution/Layer 2, customer outcomes and commerce analytics remain unimplemented.
- REFUNDED stays in the domain/schema vocabulary for future verified provider refund evidence; Phase 2 exposes request/pending only.
- Canonical deployment identity, remote staging quota, production recovery/access reviews are future release prerequisites, not claims made by local core completion.

No real payment, refund, delivery, revenue, demand or production commerce readiness is inferred from these tests. Stop after Phase 2 delivery; entering Phase 3 requires a separate explicit request.
