# 14 — Duitku POP Integration Architecture

## Current evidence — 2026-10-01

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
