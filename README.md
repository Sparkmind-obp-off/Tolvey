# TOLVEY

**Product House Hub + Commerce House Hub** for TOLVEY-owned products, initially Indonesia. V1 is not a multi-vendor marketplace. Money Kit remains a hypothesis, not validated demand or a live offer.

One canonical product source → many distribution channels → one normalized transaction model → one operational truth.

## Current delivery — PHASE 3 — DUITKU POP

**PRODUCTION CREDENTIAL AUTHENTICATION VERIFIED — PAYMENT / DEPLOYMENT UNVERIFIED**. User clarified on 2026-10-01 that the uploaded credentials belong to production, not sandbox. Current baseline main `cf53f2af5554ee1276563a7bb248d1114b046c6e`. Prior merchant-not-found evidence applies to sandbox only; it does NOT prove that the production project/key is invalid. Phase 3 is not complete.

Required file fields mapped in memory to `DUITKU_API_KEY` / `DUITKU_MERCHANT_CODE`. Real official production POP check using existing source HMAC: correct signature → HTTP 400 required paymentAmount validation; deliberately wrong signature → HTTP 401 Unauthorized. Read-only common production status query for a random nonexistent order → HTTP 404 transaction not found. This supports acceptance at the production authentication layer, NOT invoice/payment/callback/channel activation or commerce readiness. No tagihan/order/payment created. Raw secrets/signatures/provider bodies not printed or persisted. Rotate the chat-exposed key before production activation; do not send secrets in chat.

Implemented and locally verified:
- Isolated Duitku POP adapter, fail-closed sandbox config, current official HMAC-SHA256 request/callback signatures and fixed-length verification.
- Canonical positive integer IDR order → POP createInvoice → normalized reference/payment URL → existing atomic payment core. No V2 invoice, custom method selector, public customer checkout or catalog changes.
- Private initiation reservation prevents duplicate outbound invoice calls; safe receipt retry after canonical attachment failure. Ambiguous external outcomes block blind retries and require reconciliation.
- Minimal authenticated form callback route: strict encoding/content/body limits, merchant/order/reference/money/state checks, safe status mapping and callback replay/conflict protection.
- Callback HMAC does not sign resultCode/reference, so first acceptance additionally requires server-side transaction-status verification. Uses the **common official Cek Transaksi API**, not V2 checkout. Its POP-project interoperability must still be proven live; it is not presented as a POP-specific documented status endpoint.
- Neutral browser return page; supplied resultCode/query never confirms payment.
- Provider-only additive migration 0004. Existing migrations 0001–0003, canonical schema/state graph and Phase 2 regressions preserved.
- **220 passing tests** in six suites: previous 150 + 70 POP contract tests. Typecheck/format/build (~62.73 kB), fresh/upgrade/FK/integrity, concurrency/rollback and compiled workerd verification passed. npm audit: zero known vulnerabilities. No dependencies added.

Real provider authentication probes were executed, but **no invoice, hosted payment, callback or canonical payment transition** was completed. Stub responses remain local-contract evidence only. Production authentication probes now pass the limited gate above, but no secret installation, new deployment, remote migration, payment activation, DNS/resource change or Phase 4 work occurred. Existing adapter remains sandbox-only by design; changing its release environment is not accomplished by switching a URL in a probe. See [docs/14](docs/14-duitku-pop-integration.md#production-environment-correction--2026-10-01) for current evidence.

### Modules and provider boundary

- `duitku-config.ts`: sandbox environment/HMAC/limits.
- `duitku-pop.ts`: provider wire contracts/authentication/status mapping.
- `duitku-gateway.ts`: private reservation/attachment and notification orchestration/audit.
- `duitku-api.ts`: callback HTTP boundary.
- Existing `transaction-lifecycle.ts` engine reused through narrow `createPaymentCore`; generic domain/order/fulfillment never contains Duitku request or signature logic. Simulation wrapper/restrictions remain intact and absent from application bundle.

### Configuration — names only

`APP_ENV`, `DB`, `DUITKU_POP_ENABLED`, `DUITKU_ENV`, `DUITKU_MERCHANT_CODE`, `DUITKU_API_KEY`, `DUITKU_CALLBACK_URL`, `DUITKU_RETURN_URL`.

Only APP_ENV local/test + DUITKU_ENV sandbox + enabled flag + isolated DB + valid secret/HTTPS URLs are accepted. Production/staging are rejected, even with sandbox credentials. API Key and Merchant Key are the same official secret; no extra merchant-key variable. `.dev.vars.example` is disabled and contains no usable credential placeholders. Real configuration must use approved ignored runtime secret storage; never browser, logs, fixtures or Git.

### Initiation and reliability

Internal server function only: `duitkuGateway(env).initiate(orderId, {email}, requestId)`. Required email is sent to provider, not stored/logged as plaintext. Only email is accepted; client amount/currency/order/status overrides are rejected. Canonical snapshot owns amount/details/expiry; `merchantOrderId = order.id` (UUID), provider reference separate. POP hosts the payment method page; redirect URL is returned only from the trusted sandbox origin.

One durable reservation before the external request prevents concurrent duplicate calls. Same READY receipt can replay; changed meaning conflicts. If receipt persisted but canonical attachment failed, retry attaches it without another invoice. **RESERVED after ambiguous timeout/crash/error means INITIATION_RECONCILIATION_REQUIRED**: verify provider-side outcome before recovery; do not delete reservation or automatically create another invoice. Automatic reconciliation/job is not implemented or claimed.

### Callback / return / readiness

- POST `/api/provider/duitku-pop/callback`: minimum public provider route, requires enabled sandbox configuration and valid provider HMAC; form-urlencoded ≤8192 actual streamed bytes, duplicate/malformed fields rejected. Then canonical mapping/money, status verification and atomic core transition. Identical callbacks safely return 200 `OK`; conflicts do not mutate confirmed payments. Outward errors are generic with request ID.
- GET `/payments/duitku-pop/return`: neutral processing statement, ignores supplied status/query, no mutation/customer data disclosure.
- No public initiation/admin/arbitrary success/fulfillment/refund mutation API.
- When DUITKU_POP_ENABLED is true, `/ready` checks sandbox config plus all four migrations. Default foundation readiness unchanged.

Callback 00 requires status-service 00 → CONFIRMED; callback 01 requires status-service 02 → FAILED. Status-service 01 means pending, no terminal mutation. Unknown/inconsistent states fail closed. The server callback's 01 is not the browser JS pending code. Verified success intentionally leaves **PAYMENT_CONFIRMED/BLOCKED** for existing fulfillment handoff; no actual delivery or automatic authorization/retry in this phase.

See [docs/14](docs/14-duitku-pop-integration.md) for official references, wire formulas, audit/retry behavior, limitations and troubleshooting.

## Completed Phase 1 / Phase 2 foundation

Phase 1: Hono/TypeScript/Cloudflare Pages Worker, D1 Product/ProductVersion/Offer, active-only safe reads, health/readiness, security headers/request IDs/generic logs, 69 tests and BYOK foundation deployment.

Phase 2: immutable canonical purchase snapshots, atomic checkout/pending order/BLOCKED fulfillment/events, provider-neutral payment/fulfillment lifecycle, exact money validation, revision CAS/operation receipts/key aliases/replay audits, expiry/cancel/failure/retry and refund request only. Gate completed at commit `7a3b801...` with 150 tests. Phase 3 reuses that engine, not a replacement state machine.

`createSimulationCore(db, environment)` stays local/test-only. It exposes full internal simulation lifecycle but is never called by browser/provider callbacks. New provider gateway exposes payment initiation/signal processing only. Terminal orders cannot reopen; refund remains pending/requested only. REFUNDED vocabulary is not an external refund implementation.

### Existing checkpoint API

Disabled by default, production forbidden. One private internal service principal, not customer/tenant auth or Hosted admission. D1 + explicit non-production APP_ENV + TRANSACTION_CORE_ENABLED + server-only TRANSACTION_CORE_TOKEN required.

- POST `/api/transaction-core/checkouts`: JSON ≤2048 bytes, offer UUID, quantity 1–100, source label, optional opaque customer UUID; required Idempotency-Key. Create 201, matching replay 200, conflict 409. Client money/status rejected.
- GET `/api/transaction-core/checkouts/:id`, GET `/api/transaction-core/orders/:id`: protected DTOs; no private delivery/customer references or keys/hashes.
- Disabled/production 503; unauthorized 401; malformed 400; missing/unavailable 404; oversized 413; generic unexpected 500.

No production checkpoint API enablement; no public customer transaction access/rate-limit policy is implied.

## Deployment / URLs

- Repository: https://github.com/Sparkmind-obp-off/Tolvey — main.
- Existing production remains **Phase 1 only**, https://webapp-3-38j.pages.dev, deployed source `efd5d7d8408646f04e0a72afd52849ba6b550a07`. BYOK account/project/deployment identity rechecked; curl health/readiness/catalog returned HTTP 200. Not re-deployed this session; these reads do NOT prove Phase 3 deployed verification.
- Target `tolvey.pages.dev` / intended `tolvey.biz.id` not achieved here; earlier account absence was not global hostname availability. Preserve current project; see docs/25 for later deliberate identity gate.
- Preview/staging has no DB due earlier account quota, never share production D1. No remote resource was created/deleted or mutated.
- Sandbox port 3000 is temporary local runtime, not production.

## Foundation routes

GET `/` honest status (no purchasing); `/health` liveness; `/ready` schema/config; `/api/products` and `/api/offers` active-only lists with limit 1–50 and optional UUID keyset `after`; ID reads validate UUIDv4, hide draft/archived/private fields; `/static/style.css` static CSS. Collections `{data: [], next_cursor: null}`; singles `{data: {...}}`; unknown 404; denied mutations 405 except protected checkpoint create and authenticated provider callback. HEAD bodyless, OPTIONS 204, no permissive CORS.

## Data / money

D1 is canonical persistence. Products → versions → offers → checkout/order snapshots → payment → fulfillment. Events and operation/key/replay ledgers are audit, not a revenue/accounting ledger. Provider metadata is isolated in `duitku_pop_invoices` and `duitku_pop_notifications`, with no duplicate amount or plaintext credentials/customer payload.

Integer minor money ≤ Number.MAX_SAFE_INTEGER, uppercase currency, explicit exponent, exact BigInt-derived quantity bound; Offer owns price. IDR contract fixture 20000/exponent zero is test-only. Referenced versions/purchases/payment identities and confirmation history stay immutable. Private delivery references are opaque configuration, not actual downloads/assets.

Checkout lasts 30 minutes; initiation/signals enforce expiry independently of an explicit expiry operation. Cancel/expire/payment failure cannot authorize delivery. Fulfillment failure preserves confirmation, retries reuse one row. Refund request preserves original confirmation and completed history; no provider refund call.

## Local verification

Node ≥22.12; locked dependencies. Workspace `/home/user/webapp`.

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

`npm test` builds first. Formatting excludes historical Markdown/SQL; migrations validate SQL. No separate lint tool. Tests use isolated real D1/workerd and strictly stub provider traffic; ephemeral test material is not sent to Duitku. Test-only initiation harness exists in memory, never in public/dist/deploy routes. Deployed code uses Web APIs, no Node runtime imports.

Fresh `.wrangler/phase3-pop-fresh` migration and existing-local upgrade passed; old canonical records checksum unchanged, rerun no-op, FK empty and read-only SQLite integrity ok. No destructive rollback or remote schema change. PM2 default: health/ready 200, callback/checkpoint 503, public initiation absent 405, return 200. HMAC/log/DTO hygiene checks pass; pattern scan/npm audit are not a full security audit.

## Remaining blockers / next action

Remain in Phase 3. Production credential authentication is now accepted; do not keep diagnosing this supplied pair as a missing sandbox project. The original sandbox end-to-end gate still requires separate sandbox project credentials. If the release direction is changed to production, first review explicit production adapter/config/private initiation, canonical D1/migrations, HTTPS callback/return, security/recovery and controlled real-transaction authorization; current sandbox-only runtime must not be relabeled local/test to bypass restrictions. These deployment/fulfillment-authorization gaps remain unimplemented. Install approved rotated secrets through secure stdin only after the release review. Neither authentication probes nor local tests prove deployed payment/callback/order/replay or fulfillment. No legacy-signature fallback.

Production payment stays disabled. Later release requires production-specific project/key, domain/DNS, activated channels, access/rate limits, monitoring/recovery/security and real end-to-end evidence. Actual product/delivery/public storefront/distribution/Layer 2/revenue/demand remain outside this session. **Do not start Phase 4.**
