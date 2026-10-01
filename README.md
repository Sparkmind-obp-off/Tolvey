# TOLVEY

**Product House Hub + Commerce House Hub** for TOLVEY-owned products, initially Indonesia. V1 is not a multi-vendor marketplace. Money Kit remains a hypothesis, not validated demand.

**ONE PRODUCT, MANY DOORS:** one canonical product source → many distribution channels → one normalized transaction model → one operational truth. Own Shop, Distribution, and Brand/Demand remain the three business engines; this release does not re-architect them.

## Current delivery — production connection deployment

**DEPLOYED — DUITKU PRODUCTION CONNECTION VERIFIED** within the latest bounded request: implement production credential support, install secrets, deploy BYOK and verify backend connectivity. This is NOT a paid transaction, fulfillment or complete sandbox payment gate.

- Added explicit production provider configuration and official production endpoint/payment-origin selection. Production keys/config cannot be mixed with local/test sandbox or staging.
- Installed `DUITKU_API_KEY`, `DUITKU_MERCHANT_CODE` and a separate random `DUITKU_OPERATOR_TOKEN` as Cloudflare Pages **production Secrets**, securely from execution memory/stdin. No credentials in source, database, frontend, `.dev.vars`, docs or Git.
- Added a private server-side connection check that uses runtime secrets. Correct signed empty-body POP request must reach required-amount validation (HTTP 400); deliberately altered signature must return HTTP 401. No valid invoice payload, money, order or customer data is sent.
- Real deployed Worker check returned HTTP 200 with `environment=production`, `authentication=verified`, `invoice_created=false`, `payments_enabled=false`.
- Fixed actual-provider `Payment Amount` response spelling and an edge transport failure by preserving the native global fetch receiver. Manual redirect handling rejects unexpected statuses without following redirects; timeouts and actual streamed response bounds remain enforced.
- Production transaction execution remains explicitly disabled; no public initiation, checkout, confirmation, fulfillment or refund activation. Generic lifecycle/simulation restrictions stay intact. No Phase 4 work.

## URLs / deployment

- Repository: https://github.com/Sparkmind-obp-off/Tolvey — **main**.
- Live application: **https://webapp-3-38j.pages.dev**.
- Verified production-connection deployment: https://9771b4b5.webapp-3-38j.pages.dev (final source-stamped redeploy is recorded in docs/14/session report).
- Platform: owner's Cloudflare Pages account through **CF BYOK**, existing project **webapp-3**; metadata agrees with config. No new unrelated project or DNS change.
- Intended business domain `tolvey.biz.id` is not connected by this execution.
- Production D1 remains `tolvey-production`; this connection-only release uses its existing foundation schema. No remote transaction migrations or test fixtures applied; no credentials stored in D1. Preview/staging has no DB binding and cannot share production DB.

## Runtime configuration — names only

Production vars: `APP_ENV=production`, `DUITKU_ENV=production`, `DUITKU_POP_ENABLED=true`, `TRANSACTION_CORE_ENABLED=false`, exact HTTPS `DUITKU_CALLBACK_URL` / `DUITKU_RETURN_URL` on the live application origin.

Production secrets: `DUITKU_API_KEY`, `DUITKU_MERCHANT_CODE`, `DUITKU_OPERATOR_TOKEN`. API Key and Merchant Key mean the same provider secret; no extra merchant-key variable. Provider keys are never operator bearer tokens. The random operator token exists only in secret storage; generate/rotate it through the owner account when operational access is needed, never embed it in a browser or send it in chat.

`.dev.vars.example` remains disabled, local/sandbox-only, names only. Local dev/PM2 explicitly disable provider connection flags so production config is not inherited accidentally. Rotate the chat-exposed provider key in Duitku and update the same Cloudflare secret before allowing real production payments.

## API / user guide

- GET `/health`: liveness. GET `/ready`: foundation schema + enabled provider config/operator-secret presence. Readiness does not assert successful payment or make outbound provider calls.
- GET `/api/products`, `/api/offers`: active-only catalog; `limit=1..50`, optional UUID keyset `after`. GET `/api/products/:id`, `/api/offers/:id`: UUID validation, no private version/delivery data. Collections `{data:[],next_cursor:null}`; unknown 404; invalid input 400.
- POST `/api/provider/duitku-pop/connection/check`: **private operational endpoint**, `Authorization: Bearer <DUITKU_OPERATOR_TOKEN>`. No request body required; supplied body/query never controls provider URL, credentials or amount. Unauthorized 401 with no provider request. Success `{data:{environment,authentication:"verified",invoice_created:false,payments_enabled:false}}`. Failure 503, operator-only bounded HTTP/boolean/time diagnostics; no raw exception/provider body/key. This is business/API authorization, not Hosted route admission or customer auth.
- POST `/api/provider/duitku-pop/callback`: production deliberately returns 503 `PAYMENT_EXECUTION_DISABLED` internally (generic public failure); local/test sandbox still uses verified HMAC/money/reference/status and atomic lifecycle processing.
- GET `/payments/duitku-pop/return`: neutral processing text; browser query never proves or changes payment.
- Existing `/api/transaction-core/checkouts` and protected reads remain disabled/forbidden in production (503). Other mutations 405, HEAD bodyless, OPTIONS 204, no permissive CORS.

The public status page still says purchasing/payment/delivery are unavailable. Use health/readiness/catalog to inspect deployed infrastructure; use the server-only operator check for provider authentication. Do not infer sales or demand from any of these endpoints.

## Preserved foundation / transaction architecture

Phase 1: Hono/TypeScript/Pages, D1 Product/ProductVersion/Offer, safe read-only catalog, request IDs/security headers/bounded logs; 69 tests and original BYOK deployment.

Phase 2: atomic checkout/pending order/BLOCKED fulfillment/events, immutable purchase snapshots, provider-neutral lifecycle, exact money, order revision CAS, operation receipts/key aliases/replay audit, expiry/cancel/failure/retry and refund-request only. Completed at `7a3b80163b6fd6e65271a4e9b6a00c363ffceb3c` with 150 tests. `createSimulationCore` and `createPaymentCore` stay local/test-only and are not exposed for production transitions.

D1 canonical graph: Product → ProductVersion → Offer → CheckoutSession → Order → Payment → Fulfillment. Integer minor money ≤ Number.MAX_SAFE_INTEGER, currency/exponent explicit, exact BigInt quantity bound, Offer owns price. Immutable migrations 0001–0004, canonical snapshots and provider metadata remain unchanged. Events are audit, not a financial ledger.

Existing sandbox adapter reservation prevents duplicate external invoice creation; READY receipts can recover attachment without another invoice. Ambiguous RESERVED outcomes require reconciliation, never deletion/blind retry. HMAC does not cover resultCode/reference, so first callback needs additional status verification. Full real invoice/payment/callback/status compatibility remains unverified; no fake success, delivery or refund.

## Tests / local development

Node ≥22.12, locked dependencies, workspace `/home/user/webapp`.

```sh
npm ci
npm run check
npm run db:migrate:local
# Optional TEST fixture only, never remote:
npm run db:seed:local
# Build before starting; free port 3000 first:
pm2 start ecosystem.config.cjs
curl http://localhost:3000/health
curl http://localhost:3000/ready
```

Final regression: **237/237 tests in six suites**, typecheck/format/build passed (Worker 65.58 kB). Includes environment isolation, private auth/no traffic on denial, response secrecy, native fetch receiver, endpoint/redirect constraints and compiled production connection checks. Tests use real isolated D1/workerd and strict provider stubs, never supplied live credentials. Deployed provider authentication is separate real-network evidence. No new dependencies, Node runtime imports or migration rewrites. Format excludes historical Markdown/SQL; SQL covered by migrations/tests. Exact-value scans are scoped security evidence, not a complete security audit.

## Remaining work / next gate

The latest credential-storage/backend-connectivity/deployment request is implemented. Original Phase 3 end-to-end sandbox gate is NOT complete, and production payment processing is NOT active. Before real commerce: separate authorization for transaction release, reviewed production canonical gateway/schema/private initiation, eligible real offers, reachable verified callback/status/replay, rate limits/monitoring/recovery, key rotation and controlled payment evidence. Actual fulfillment/delivery, catalog expansion, distribution and re-architecture remain outside this release. **Phase 4 not started.**

See [docs/14](docs/14-duitku-pop-integration.md) for timestamped deployment/evidence and historical attempts; [docs/39](docs/39-vision-mission-north-star.md) remains strategic authority.
