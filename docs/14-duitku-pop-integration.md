# 14 — Duitku POP Integration Architecture

## Production connection implementation and BYOK deployment — 2026-10-01

**DEPLOYED — DUITKU PRODUCTION CONNECTION VERIFIED** for the latest explicitly bounded request: implement the production key/configuration, install secure secrets, deploy to the existing owner account, verify backend connectivity, then push main. This does not close the original sandbox payment/callback gate or claim production commerce readiness. Baseline main `d6d3688ea260477d9f1269940fee3ff3759492e9`; strategy remains ONE PRODUCT, MANY DOORS. No Phase 4/re-architecture.

### Implementation / security contract

- `duitkuConfig` accepts only local/test+sandbox or production+production, enabled flag, DB and validated credentials/HTTPS callback/return. Staging and mixed environments fail closed. `duitkuEndpoints` permits only exact official sandbox/production origins; provider key/reference identity and payment URL validation depend on the selected environment.
- New POST `/api/provider/duitku-pop/connection/check`: server-only `DUITKU_OPERATOR_TOKEN` bearer authorization, separate from the provider API key. Invalid auth 401 before any provider request. No body/query-controlled URL, credential, amount or order. Success is environment/authentication + `invoice_created=false`, `payments_enabled=false`; failures expose only bounded HTTP/boolean/time/static-cause diagnostics to the authenticated operator, never raw exceptions/bodies/secrets. No public status-probe endpoint and no arbitrary state mutation.
- Connection method signs a deliberately empty POP request and a negative signature control. It requires signed HTTP 400 with required `Payment Amount` validation and control HTTP 401. A provider invoice cannot be created without the required amount/order/contact payload. This proves limited authentication, not channel eligibility or a successful payment.
- Real preflight initially revealed `Payment Amount` spacing, corrected with a regression. Initial deployed checks failed during transport. Preserving the native global fetch receiver via a wrapper resolved the edge failure; regression reproduces a receiver-sensitive native fetch. Manual redirect handling rejects unexpected status instead of following it. TLS, 10-second request timeout and 16-KiB streamed response limit retained.
- `duitkuGateway` explicitly rejects production with `PAYMENT_EXECUTION_DISABLED`; generic payment/simulation factories retain local/test guards. Current invoice metadata/schema remain sandbox-only. Production callback/checkpoint return 503, no public initiation or delivery. Production readiness checks foundation/config/operator-secret presence, not transaction tables or provider payment success; sandbox readiness still requires all four migrations.
- Existing Pages project `webapp-3`, main, own Cloudflare account/BYOK. Production Secrets installed successfully through stdin: `DUITKU_API_KEY`, `DUITKU_MERCHANT_CODE`, `DUITKU_OPERATOR_TOKEN`. Uploaded provider file was parsed only in memory. Operator tokens generated randomly and never saved in files or printed. No DB/frontend/source secret storage, no DNS/project creation. Exposed provider key should be rotated through Duitku and updated under the same Cloudflare secret name before real payment activation.
- Production vars: APP_ENV/DUITKU_ENV production, POP connection flag true, transaction flag false, callback/return on existing live HTTPS origin. Preview has no production DB. Local dev/PM2 force provider flags off/sandbox to avoid inheriting production vars.

### Final committed-source stamp / audit pointer

Final code delivery: `d73a4dfba04c8207f2b5f440e0052840cefdfc3d`. Final immutable deployment https://41ec3dbc.webapp-3-38j.pages.dev, deployment ID `41ec3dbc-3c98-4e1c-896c-a826267e39b1`, source `d73a4df`. At 2026-10-01T10:28:27.668360Z both immutable and main URLs passed health/ready/catalog/return 200, unauthenticated private check 401, authenticated production connection 200 with `invoice_created=false,payments_enabled=false`, callback/checkpoint 503. The earlier 9771b4b5 deployment below is superseded by this source-stamped redeploy. No invoice/payment/callback processing/delivery proof implied.

Subsequent documentation audit updates docs/15–16/19 and current status references; it does not redeploy runtime or call authenticated provider checks. Later documentation SHA is not this deployed source. All sandbox/credential/no-deploy statements in **historical** sections describe their original checkpoint; current config/secret/deployment contract is the production-connection section above. No Phase 4 code is implemented by the audit.

### Actual deployment / live evidence (release chronology)

- Deployment + secret installation first performed at approximately 2026-10-01T10:13Z. Health/readiness/catalog/neutral return HTTP 200; private check unauthenticated 401; callback/checkpoint 503. Authentication initially 503, not claimed successful. Operator-safe diagnostics used to resolve transport; an early immutable URL 404 during deployment access was not treated as success.
- Successful verified deployment: **https://9771b4b5.webapp-3-38j.pages.dev**, live main **https://webapp-3-38j.pages.dev**, approximately 2026-10-01T10:20Z. Actual deployed Worker `/ready` HTTP 200, authenticated POST connection check HTTP 200: `{environment:"production",authentication:"verified",invoice_created:false,payments_enabled:false}`. These were real outbound Duitku production calls using Cloudflare runtime secrets, not stubs or a uploaded-file dependency.
- Final committed-source redeploy and exact Git SHA/clean remote match are reported after execution; no self-referential SHA is fabricated here. No remote migration/test fixture/order/payment/fulfillment/refund/data mutation was performed. No provider invoice/reference/payment URL, real callback or paid-state/replay evidence claimed.

### Verification / remaining scope

Final `npm run check` exited 0: **237/237 tests in six suites**, 224.67s; typecheck, Prettier and final build **65.58 kB** passed. Includes native receiver, scoped diagnostic/secret hygiene, cross-environment isolation, auth denial without provider calls, production URL allowlist, foundation-only compiled readiness, and unchanged core concurrency/replay/rollback suites. All tests are local contract/workerd evidence; successful deployed provider check is separate real-network evidence. Earlier full run 235 passed, then real edge fixes and additional regressions were added. Dependencies and immutable migrations 0001–0004 unchanged. Exact provider values scanned in tracked files, dist, PM2 logs, all 70 Wrangler CLI logs and 318 reachable Git objects: zero matches; `.dev.vars` absent. Remote logs were not independently read; no complete security audit claimed.

Current credential-storage/backend-connection/deployment request is delivered. Full sandbox payment gate remains unverified, and production transaction processing intentionally remains inactive. Next commerce release requires separately reviewed production canonical schema/gateway/private checkout/offer/callback/status/replay, rate limits/recovery/monitoring and controlled payment authorization/evidence. No actual delivery, revenue or demand. **Phase 4 NOT STARTED.**

## Historical production environment correction — 2026-10-01

Current status: **PRODUCTION CREDENTIAL AUTHENTICATION VERIFIED — PAYMENT / DEPLOYMENT UNVERIFIED**. User explicitly clarified that the supplied file contains live production credentials and authorized production connection checks. Baseline main `cf53f2af5554ee1276563a7bb248d1114b046c6e`. The earlier sandbox merchant-not-found result remains a truthful observation for that environment, not a declaration that the production credential pair/project is invalid.

Official contracts rechecked: https://docs.duitku.com/pop/id/ and https://docs.duitku.com/api/id/ (both HTTP 200). POP production endpoint `https://api-prod.duitku.com/api/merchant/createInvoice`; common read-only status endpoint `https://passport.duitku.com/webapi/api/merchant/transactionStatus`. Documented HMAC-SHA256, three POP headers and epoch-ms example matched source. No obsolete signature fallback.

Latest uploaded file was read again in memory and mapped to existing names. Source Web Crypto HMAC independently matched Node HMAC. Real production checks, with TLS enabled, bounded response/timeouts, secrets sent only via curl stdin and no raw bodies retained:

| UTC time | Non-transactional check | Observed result |
| --- | --- | --- |
| 2026-10-01T09:44:41Z | POP POST, correct signed headers, deliberately empty body | HTTP 400 required paymentAmount validation; no merchant-not-found/unauthorized classification |
| 2026-10-01T09:44:42Z | Same POP request, deliberately altered signature negative control | HTTP 401 Unauthorized |
| 2026-10-01T09:44:42Z | Common production transactionStatus query, random nonexistent order ID, correct signature | HTTP 404 transaction not found |

The positive/negative signature contrast supports acceptance of the uploaded pair at the **production POP authentication layer**. This is NOT a created invoice, channel eligibility/activation proof, production payment, callback verification, status compatibility for a real POP order or deployment readiness. No amount/order/invoice/payment created and no production transaction attempted. No remote migration, secret installation, deploy, DNS change or Phase 4 work. Existing gateway/config remain local/test + sandbox-only; never spoof local/test on a production deployment or feed production keys into sandbox-enabled runtime.

The old blanket credential/project-blocked status is superseded. Original sandbox end-to-end gate is still incomplete and needs sandbox credentials if retained; moving the application to production requires explicit release review of adapter/environment/private initiation/D1/callback/security/authorization and controlled real-transaction scope. Key exposed in chat should be rotated before production activation. This correction changes evidence only, not runtime or architecture. Prior 220-test result is historical; no full regression rerun claimed for this documentation-only correction. Formatting, secret-value scan and clean pushed-main evidence are reported after execution.

## Historical direct file execution — 2026-10-01

Primary status: **DUITKU CREDENTIAL / PROJECT BLOCKED**. Baseline main `c923f5268b5c195379b9e8102fc164a5c5755660`. Same Phase 3, no Phase 4.

- First tool action inventoried the upload directory: four user-uploaded text files found. Workspace/config inventory and shallow mounted-drive inspection followed; mounted AI Drive was empty. The explicitly attached latest file was selected, read and parsed in memory. Required names mapped to existing runtime secret names. Format valid; no sandbox marker, which did NOT prevent use. Latest file bytes equal the preceding attachment; uploading it again did not change the supplied credential pair.
- At **2026-10-01T07:06:18Z**, real signed POST to official sandbox POP `createInvoice`, empty JSON body: **HTTP 400**, exact merchant-not-found classification, not missing-required-field or signature-rejection classification. No mock credentials/response.
- At **2026-10-01T07:13:27Z**, real signed diagnostic request with merchant order ID/product/email/callback/return fields but deliberately NO paymentAmount: **HTTP 400**, exact merchant not found; no missing-order-ID classification. This is an authentication/configuration probe, not an invoice or canonical order.
- At **2026-10-01T07:14:30Z**, real request to official PHP example's lowercase `createinvoice` path, signed using bundled existing `src/duitku-config.ts` Web Crypto HMAC function and uploaded file values: **HTTP 400**, merchant not found. Path case did not resolve rejection; source algorithm output also independently matched Node HMAC. No legacy signature or production endpoint used.
- Official POP docs re-fetched successfully via curl: endpoint, three header names, HMAC-SHA256 concatenation and epoch-millisecond example match current source. Initial urllib documentation fetch returned 403; curl succeeded. Rejection is not evidence that a key is valid or a signature was accepted. No endpoint/header/HMAC bug was demonstrated, so no unsupported runtime change was made. Provider merchant lookup failed in the tested sandbox; inactive/nonexistent/production-only/mismatched-project causes cannot be distinguished without owner dashboard/support evidence.
- A standalone compiled-gateway diagnostic stalled during isolated Miniflare D1 startup (one tool timeout, then a bounded retry stopped before D1-ready/checkout stage). It supplies **no full-order or provider-request evidence**. Regression tests still passed using their existing workerd harness. No fake state or successful invoice was substituted for this incomplete diagnostic.
- Current `npm run check` exited 0: **220/220 tests, six suites**, typecheck, Prettier and build passed (221.47s suite; Worker 62.73 kB). `npm audit`: zero known vulnerabilities. Local preview was paused during tooling diagnosis and restored via PM2 after build; credential-free local health/readiness HTTP 200. Source, migration history, dependencies and deployment configuration remain unchanged.
- BYOK token setup/`wrangler whoami` succeeded; metadata/config target is still existing `webapp-3`. Provider validation did not pass, therefore **secret installation, remote migration, new deploy and deployed sandbox verification NOT PERFORMED**. No production database reused, unrelated project created or DNS changed. Existing site's earlier foundation reads do not satisfy this request's deployed verification gate.
- Secrets/signatures/raw response bodies remain execution-memory only. Credential values never placed in command arguments, `.dev.vars`, fixtures, docs, source or Cloudflare. Exact-value scan: zero matches in tracked files, dist and TOLVEY PM2 logs; no matches in 304 reachable Git objects. `.dev.vars` absent; formatting/diff checks and Git integrity pass. Remote logs not inspected. Exact commit/remote-main match/clean-tree are reported after push. Key exposed in chat still requires rotation; secure uploaded file is an accepted input mechanism, not the blocker.

**Next action:** owner must confirm an active project in the Duitku sandbox portal and obtain its matching key, or resolve the merchant-not-found result with Duitku support. Use secure upload/runtime input, not chat. After provider acceptance, remain in Phase 3 for the reviewed sandbox-environment/private-initiation/isolated-D1/fulfillment-authorization gaps, actual secret installation and existing-project BYOK deployment, then real deployed invoice/payment/callback/status/order/replay verification. No payment success, revenue, delivery or production readiness claimed. **Phase 4 NOT AUTHORIZED.**

## Earlier live execution attempt — 2026-10-01

Primary status: **SANDBOX VERIFICATION BLOCKED**. This section supersedes the earlier credential-unavailable execution status below; historical local-contract evidence remains valid, not live-payment evidence.

### Scope / repository

- User explicitly authorized secure consumption of the uploaded execution file and Cloudflare BYOK deployment after provider credential validation. Phase 4 is forbidden.
- Read current docs 39/34/15/14/28, README, Wrangler config, provider source/migration/tests and transaction boundaries. Strategy remains ONE PRODUCT, MANY DOORS; no marketplace, catalog expansion or product-demand claim.
- Branch main; clean fetched baseline `5c515ffc8c5e27a0e2049aa5ba765392b3913f3e`. Provider implementation inherited from `8a857ef84a91248de0dfa7525edcdc4203282345`. Evidence changes are delivered in the Git commit containing this section; its exact SHA and remote match are reported after push (no self-referential commit hash).

### Execution-secret handling / contract

- Credential file detected; required input names `API_KEY_DUITKU` and `CODE_MERCHANT` detected. Values parsed only in execution memory; no explicit sandbox environment marker detected.
- Mapping: `API_KEY_DUITKU` → `DUITKU_API_KEY`; `CODE_MERCHANT` → `DUITKU_MERCHANT_CODE`. No duplicate secret names introduced.
- Required provider secret names remain `DUITKU_API_KEY`, `DUITKU_MERCHANT_CODE`. Other required configuration: `APP_ENV`, `DB`, `DUITKU_ENV`, `DUITKU_POP_ENABLED`, `DUITKU_CALLBACK_URL`, `DUITKU_RETURN_URL`. Existing fail-closed configuration/readiness checks validate presence/format, but cannot prove provider authentication or replace a future deployment secret preflight.
- No raw credential/body/header/signature/provider error text was printed or persisted. Curl received sensitive header configuration through stdin, never command arguments. No credential copied to workspace, `.dev.vars`, source, docs, Git or Cloudflare secrets.
- User exposed the key in chat again. Rotation remains required. A rejection does not establish whether a key is invalid, production-only, or mismatched; do not infer any of those as proven.

### Real provider probes (not mocks)

| UTC time | Endpoint / operation | Observed evidence | Limit |
| --- | --- | --- | --- |
| 2026-10-01T06:51:03Z | Common sandbox `transactionStatus`, POST, current documented HMAC, random nonexistent order identifier | HTTP 404; no allowlisted provider status or authentication success established | Non-mutating probe, not a real order/payment; POP/status interoperability remains unverified |
| 2026-10-01T06:51:33Z | Official POP sandbox `createInvoice`, signed headers, intentionally empty JSON body | HTTP 400, merchant-rejection classification, no invoice reference | Authentication/configuration probe only; insufficient fields intentionally prevent invoice creation |
| 2026-10-01T06:51:53Z | Same POP sandbox authentication probe, urllib transport | HTTP 400; sanitized classification `merchant_not_found=true` | No raw response exposed; authentication success NOT proven |
| 2026-10-01T06:53:16Z | Same POP sandbox authentication probe, independent curl transport | HTTP 400; `merchant_not_found=true`, signature-rejection classification false | Confirms observed rejection classification, not a complete valid invoice request or signature acceptance |
| 2026-10-01T06:57:06Z | Same POP sandbox probe, precise phrase disambiguation | HTTP 400; exact phrase merchant not found detected; missing merchant-order-ID phrase not detected; non-JSON response | Rejection concerns merchant lookup, not an inferred missing-order error; raw text discarded |

Only sandbox endpoints were used; no production provider endpoint, obsolete-signature fallback, fake callback, simulated paid order or payment was attempted. TLS verification remained enabled, bounded read/timeouts used. Raw responses were classified in memory and discarded. No invoice/order/provider reference exists for this execution. No payment-flow URL, callback, live signature acceptance, canonical payment transition, fulfillment authorization or live duplicate/replay was proven.

### Cloudflare BYOK / deployed reads

- Owner token setup and `wrangler whoami` succeeded; existing project metadata/config/inventory agree on `webapp-3`, main. Nine D1 databases listed; no capacity/provisioning claim and no unrelated resource modified.
- Existing production DB remains `tolvey-production`; never reused for sandbox. No resource creation, remote migration, secret installation, new deployment or DNS change occurred.
- `pages deployment list` confirms existing foundation deployment `ebe25222-ac17-400b-9211-520603e26f89`, source `efd5d7d`, https://webapp-3-38j.pages.dev. This is NOT a Phase 3 deployment.
- Read-only checks via curl: `/health`, `/ready`, `/api/products`, `/api/offers` HTTP 200; supplied credential values absent from captured response bodies. Earlier urllib requests returned HTTP 403; transport discrepancy is recorded, not silently represented as successful urllib access.
- Provider credential validation did not pass, so installation of `DUITKU_API_KEY` / `DUITKU_MERCHANT_CODE` and the requested Phase 3 BYOK deployment are **not performed / blocked**, not successful. No deployed checkout/initiation/callback/payment/fulfillment evidence exists.

### Regression / security / delivery

- Current-session `npm run check` exited 0: TypeScript typecheck, Prettier, **220/220 tests in six suites** (267.19s), compiled workerd callback/transaction regressions and final Vite build **62.73 kB** all passed. No ignored failing test. These are local contract tests, not live payment success.
- Fresh local-only Wrangler migrations 0001–0004 under ignored `.wrangler/phase3-live-attempt` passed; second application reported no pending migrations. FK check empty; two generated local SQLite files checked read-only: integrity `ok`, zero FK violations. All four migration files byte-identical to baseline. No remote database touched.
- `npm audit --audit-level=low`: zero known vulnerabilities. `git diff --check`, formatting recheck and `git fsck --no-dangling` passed.
- Exact supplied API-key/merchant values scanned in tracked files, generated `dist`, existing TOLVEY PM2 logs and all 296 reachable Git objects: **zero file matches / no history match**. `.dev.vars` absent; credentials remain outside workspace. Captured existing foundation response bodies also had no exact supplied values. No provider raw-body or screenshot evidence retained. Remote runtime logs were not inspected and cannot be claimed audited.
- `.gitignore` additionally blocks manually supplied `kredential*` and credential TXT/JSON/YAML filenames; test filename checks confirm credential/env paths ignored. No new dependencies, runtime edits or migration changes. Only evidence and credential-file ignore protection changed.
- Commit/push exact SHA, remote-main equality and final clean-tree state are verified after this evidence revision and reported in the final execution report. Local tests/scans never substitute for missing real provider/deployed evidence.

### Unblock / remaining mandatory technical gates

1. In the Duitku sandbox portal, confirm an activated sandbox project exists and obtain its matching rotated project key via secure file/runtime input. Supplied project identity was classified as not found by POP; consult Duitku support if portal configuration appears valid. Do not switch to production endpoints to test the same key.
2. Repeat bounded sandbox authentication/configuration verification; a valid real invoice must subsequently prove initiation (empty-body probes cannot prove it).
3. Implement/review explicit dedicated deployed sandbox environment without pretending production is local/test; isolated D1; narrow authenticated initiation boundary; required-secret preflight; idempotent verified-payment → existing fulfillment authorization, with no delivery. Current local/test-only factory and absent initiation route are known unimplemented deploy gaps, NOT claimed fixed.
4. Install validated secrets securely, migrate only isolated sandbox D1, deploy to the intended reviewed TOLVEY sandbox target, then execute real hosted sandbox payment and reachable HTTPS callback/status verification with canonical state and duplicate/replay evidence.
5. Run all regressions/scans, record live evidence and Git delivery. Only the complete gate authorizes Phase 4. **Phase 4 NOT AUTHORIZED / not started.**

## Historical local-contract evidence — 2026-10-01

**PHASE 3 — CODE COMPLETE / SANDBOX BLOCKED**, subject to final clean pushed-main delivery. Evidence: **LOCAL CONTRACT TEST ONLY**. Baseline Phase 2 main: `7a3b80163b6fd6e65271a4e9b6a00c363ffceb3c`. No Phase 4, production deployment, DNS, remote D1, actual delivery, refund or customer transaction.

**SANDBOX CREDENTIALS NOT AVAILABLE**: credentials shared in chat/upload are treated as compromised and were not read from the file or reused. No rotated approved sandbox runtime secret was available. Live invoice/payment/callback and POP-project status-verification interoperability have NOT been tested.

## Official sources rechecked

- https://docs.duitku.com/payment-gateway/overview/
- https://docs.duitku.com/payment-gateway/api-browser/
- https://docs.duitku.com/pop/id/ and https://docs.duitku.com/pop/en/
- https://docs.duitku.com/en/account/
- https://docs.duitku.com/api/id/#cek-transaksi — common verification API, not V2 invoice creation.

The current POP documents specify HMAC-SHA256. The linked official PHP SDK still shows legacy SHA256/MD5 for some methods; those legacy formulas were **not implemented**. Official examples lack a self-contained known key/message/output vector, so tests use RFC4231 plus independent Node HMAC computation for the exact documented concatenations. UNIX timestamps are UTC epoch milliseconds; do not add a Jakarta timezone offset.

The POP page does not specify a transaction-status API contract or mandatory callback response body/retry schedule. The common official Cek Transaksi endpoint is used for additional verification because callback HMAC does not sign resultCode/reference. That endpoint's applicability to the rotated POP sandbox project, acknowledgement handling and actual returned statuses must be proven during live sandbox verification. This is recorded as an unverified integration assumption, not a fabricated POP contract. No V2 invoice/payment-method UI is built.

## Isolation and components

Commerce Core → provider adapter → Duitku POP.

- `duitku-config.ts`: fail-closed sandbox configuration, HMAC, comparison, bounded UTF-8 reads.
- `duitku-pop.ts`: POP createInvoice, reference/payment URL mapping, form authentication, normalized status mapping, server-to-server status verification.
- `duitku-gateway.ts`: private initiation reservation/attachment, authenticated notification processing, provider-only audits and canonical transitions.
- `duitku-api.ts`: minimum callback HTTP route with sanitized failures.
- `transaction-lifecycle.ts`: existing Phase 2 engine reused unchanged through a narrow provider-neutral `createPaymentCore` facade exposing only initiation/signal processing. Existing simulation factory/restrictions/regressions are preserved. No Duitku fields/signatures inside the generic engine/domain.

## Configuration / separation

Actual variable names:
- `APP_ENV`
- `DB`
- `DUITKU_POP_ENABLED`
- `DUITKU_ENV`
- `DUITKU_MERCHANT_CODE`
- `DUITKU_API_KEY`
- `DUITKU_CALLBACK_URL`
- `DUITKU_RETURN_URL`

Only trusted APP_ENV local/test, enabled flag true, sandbox environment and DB are accepted. Production/staging and DUITKU_ENV=production are always rejected in this phase. The API key is the same official secret also called Merchant Key; there is **no separate DUITKU_MERCHANT_KEY variable**. No account credential/merchant code is hard-coded in application source. Runtime secrets belong in approved ignored local configuration or later approved non-production secret storage; not chat, browser, logs or Git.

Callback/return must be HTTPS, same origin, exact paths below, no URL credentials/query/fragments; configured URLs max 255 chars. There is no arbitrary provider base-URL override. Preview still has no DB and must not share production D1. A complete sandbox project/customer test setup is required before any live call.

## Initiation — internal function only

`duitkuGateway(env).initiate(orderId, {email}, requestId)` is a privileged server function, not a public HTTP/customer/admin endpoint. Only email is accepted as contact input; client amount/currency/order/status fields are rejected. Email is required by the official POP contract, passed to the provider but not persisted/logged as plaintext. No customer-account/contact database is introduced.

Canonical order must exist, be CHECKOUT_STARTED/PENDING, positive safe integer IDR with exponent zero, not cancelled/expired/paid and have at least one minute remaining. Canonical amount/details are loaded by server; merchantOrderId is the immutable canonical order UUID (36 chars, within official 50 limit), not caller-supplied or provider reference. Provider reference remains separate.

POST `https://api-sandbox.duitku.com/api/merchant/createInvoice`, JSON:
- paymentAmount from canonical order
- merchantOrderId = order.id
- productDetails from order offer snapshot
- required email, callbackUrl, returnUrl
- expiryPeriod = floor remaining canonical minutes; never extends checkout
- paymentMethod omitted: method selection remains hosted by Duitku POP.

Headers: Content-Type application/json, x-duitku-merchantcode, x-duitku-timestamp (epoch ms), x-duitku-signature = lowercase hex HMAC-SHA256(merchantCode + timestamp, apiKey). No legacy fallback. HTTPS verification is not disabled; redirects are forbidden, timeout 10 seconds, response bounded 16 KiB.

Response must have statusCode 00 and matching merchantCode, bounded reference and HTTPS app-sandbox.duitku.com `/redirect_checkout?reference=<matching reference>`. Unsafe/cross-environment URLs are rejected. Result is provider-neutral `{provider_reference, status: PENDING, payment_url, replayed}`; no raw response/key is returned. POP redirect is the chosen supported UI option; no public customer checkout or popup page is added.

## External side-effect reliability

Migration 0004 reserves one provider invoice per order before calling the provider. Durable ownership prevents concurrent workers from making duplicate createInvoice calls. Project/request hashes bind retries; changed email/project meaning conflicts. No raw key or plaintext email stored.

Successful provider receipt is persisted before canonical attachment using Phase 2's stable operation key. If canonical attachment fails, retry can attach that same receipt without another provider request. A READY receipt is immutable and replayable while the canonical order is payable/pending.

**Ambiguous network/crash/provider response failure leaves RESERVED and returns INITIATION_RECONCILIATION_REQUIRED on retry.** Do not delete the reservation, change merchantOrderId, release it automatically or blindly send another invoice. Operator must verify the provider-side invoice/result through approved reconciliation before choosing a recovery action. No generic retry guarantee or automatic reconciliation job is claimed. Stopping safely is intentional; live outage/recovery runbook needs sandbox evidence before production.

## Callback flow

POST `/api/provider/duitku-pop/callback` is the only newly permitted public mutation. Configuration is disabled by default and forbidden in production. Requires application/x-www-form-urlencoded; actual streamed size ≤8192 bytes, strict UTF-8/percent encoding, duplicate fields rejected, ≤40 fields, bounded values. Unneeded card/customer/provider metadata is not retained.

1. Validate merchant identity, canonical lowercase UUID and positive canonical decimal integer amount spelling.
2. HMAC-SHA256(merchantCode + amount + merchantOrderId, apiKey); fixed-length comparison. MD5 signatures are rejected.
3. Resolve provider invoice and canonical payment; compare project, stored reference, amount, IDR/exponent and order mapping.
4. For a first notification, query the common official verification endpoint over authenticated server-side HTTPS: `https://sandbox.duitku.com/webapi/api/merchant/transactionStatus`, JSON merchantCode/merchantOrderId/signature, where signature = HMAC-SHA256(merchantCode + merchantOrderId, apiKey).
5. Verify returned merchantOrderId/reference/amount and final status before constructing normalized signal. Unknown/pending/inconsistent/outage is fail-closed, no success.
6. Call existing provider-neutral atomic `processSignal`, validating legal pending state and expiry. Append provider-safe audit outcome/hash/context. Successful canonical confirmation is atomic with its business event/operation receipt.
7. Return HTTP 200 plain `OK` only after successful processing or identical replay. Invalid 400/401, unknown 404, semantic conflict 409, oversized 413, unavailable/pending 503; all outward errors generic with request ID, no raw provider/SQL/body/secret.

Provider audit is supplemental append-only history, not a financial ledger. Invalid unauthenticated notifications are represented in bounded HTTP outcome logs, not stored raw in D1. Authenticated conflicts/rejections are persisted with hash/code/request ID. If supplemental audit persistence fails after a canonical commit, acknowledgement fails and a later retry safely replays the canonical receipt; it cannot repeat payment confirmation.

## Status mapping and replay

| Context | Provider code | Action |
| --- | --- | --- |
| createInvoice | 00 | Invoice created; canonical payment PENDING, not paid |
| server callback | 00 | Candidate CONFIRMED, requires matching status query 00 |
| server callback | 01 | Candidate FAILED, requires matching status query 02 (canceled/final unsuccessful) |
| status query | 01 | Pending, reject final mutation/retry later |
| unknown/inconsistent | any other | Fail closed |

Callback 01 is NOT the browser JS pending code. Unknown terminal failure variants are not guessed. Verified success reaches PAYMENT_CONFIRMED/BLOCKED as the explicit fulfillment handoff. No fulfillment authorization, actual delivery, automatic failure retry, revenue aggregate or refund API occurs in Phase 3.

Deterministic notification identity is provider + stored reference, not unsigned publisher fields. The normalized fingerprint includes amount/reference/status/order. Identical authenticated retries replay the immutable Phase 2 receipt, including during status-service outage after first acceptance. A changed result/reference/amount conflicts and cannot mutate a successful payment. Twelve concurrent duplicates produce one confirmation and one payment/fulfillment row.

## Browser return

GET `/payments/duitku-pop/return` renders a neutral processing statement. It neither echoes supplied query data nor reads/changes payment state. resultCode=00, a closed popup, or reaching this page never proves payment. Actual customer status/authorization/UI belongs to a later phase.

## Verification and troubleshooting

220 tests in six suites: unchanged Phase 1/2 regressions plus 70 POP tests. HMAC vectors, config separation, canonical request validation, response hardening, 10 concurrent initiation requests, 12 duplicate callbacks, conflicts/terminal/amount/reference/merchant errors, malformed/oversized bodies, unsigned-result tampering, failure/rollback/retry and log/DTO hygiene verified locally. Compiled workerd uses a strict in-memory provider stub and actual application callback route for success/failure/duplicate/invalid cases. Stub calls are never live Duitku evidence.

Fresh/upgrade Wrangler local migration 0004, checksum-preserved old canonical records, rerun no-op, FK empty, local read-only SQLite integrity ok. Existing 0001–0003 bytes unchanged. Typecheck/format/build (~62.73 kB) pass; no new dependency; npm audit zero known vulnerabilities. PM2 without provider credentials: health/ready 200, callback/checkpoint 503, public initiation absent 405, return 200.

- PAYMENT_UNAVAILABLE: inspect sandbox flag/environment/DB/required secret and exact HTTPS URL configuration without logging secrets.
- INITIATION_RECONCILIATION_REQUIRED: reservation has an uncertain external outcome; reconcile rather than retry creation.
- STATUS_NOT_FINAL: provider status is pending/inconsistent; preserve internal truth and allow authenticated notification retry.
- Reference/money/conflicting callback: inspect safe hashes and canonical provider reference; never override confirmation or fulfillment from a browser.
- Production intentionally remains disabled. No domain/DNS/deploy/resource mutation or remote migration is authorized here.

## Remaining gate

Rotate the exposed key, configure an activated sandbox project through approved secrets, provide a reachable approved non-production HTTPS callback/return origin and isolated DB, and execute live POP invoice → hosted payment → callback → common status verification → canonical success/failure/duplicate checks. Confirm HMAC rollout/status API applicability and acknowledgement behavior with the actual project; do not enable MD5/SHA fallback if incompatible. Live evidence is required before leaving Phase 3.

Production later requires its own project/key/environment/gateway review, activated channels, callback/domain, security/rate limits/monitoring/recovery, real end-to-end verification and separate release authorization. Phase 3 code verification alone does not satisfy those requirements.
