# TOLVEY

**Product House Hub + Commerce House Hub** for TOLVEY-owned products, initially serving Indonesia.

Commercial architecture: **Layer 0 Free/Discovery → Layer 1 Digital Products → Distribution Layer → Layer 2 Services**. The canonical Layer 1 hierarchy is **Product Family → Single Product → Kit → Bundle → Complete System**. Money Kit remains a product hypothesis, not an implemented commercial offer or evidence of demand.

One canonical product source -> many commerce/distribution channels -> one normalized transaction model -> one operational truth.

Demand -> Product -> Package -> Publish -> Distribute -> Sell -> Deliver -> Measure -> Learn -> Improve.

## Current delivery — PHASE 2 — TRANSACTION CORE — IN PROGRESS

This is a coherent execution checkpoint, **not Phase 2 completion**. Baseline main was fast-forwarded to `1b73d3bb16192a1b5d381237904cf62e7624ce49` and the latest commercial/system documentation was inspected before coding.

Implemented and verified locally:
- New immutable migration `0002_transaction_core.sql`: CheckoutSession, Order, Payment, Fulfillment, transaction events, integrity/uniqueness constraints, immutable purchase snapshots, append-only audit, and guarded order-state graph.
- Atomic checkout + pending order + BLOCKED fulfillment + two creation events using one D1 batch. No Payment is invented during checkout.
- Amount/currency/version/name/delivery snapshots are read and calculated from active canonical records **at write time**. Quantity is 1–100, multiplication bounded using exact BigInt division and SQL integer constraints. Client totals/currency/status are rejected.
- Hashed operation-scoped idempotency key plus normalized request hash; retries return the existing result, conflicting meaning returns 409. Twelve concurrent identical attempts were tested with one winner; injected batch failure rolled everything back and retry succeeded.
- Referenced version identity/content and checkout/order snapshots are frozen. Future price/name changes cannot rewrite an existing purchase. Referenced offers cannot be repointed to another version; use a new offer instead.
- Provider-neutral TypeScript adapter contract and legal transition validator. These are not a provider implementation or complete persistent lifecycle service.
- Protected **non-production only** internal API (below), feature-flagged off by default. Production is explicitly rejected even if the flag/token are present. No public checkout, payment-confirmation endpoint, or operator catalog API exists.
- 109 passing automated tests: the unchanged 69 Phase 1 tests plus 40 checkpoint tests against real D1/workerd. Typecheck/format/build pass; Worker approximately 39.81 kB. Local upgrade and fresh migrations pass; reapplication is a no-op.

Still required inside Phase 2: atomic payment initiation/status-signal processing; full cross-entity compare-and-swap lifecycle orchestration; expiry/cancellation; fulfillment authorization/retry/completion; refund representation operations; duplicate callback/revenue/concurrent-transition tests; full test-only end-to-end lifecycle; production release gate and deployment identity resolution. Schema constraints are defense in depth, not proof those services exist. Timestamps include expiration, but expiration is not yet processed automatically. No real payment/delivery is claimed.

### Internal checkpoint API

Non-production requires a D1 binding, `TRANSACTION_CORE_ENABLED=true`, and a private random `TRANSACTION_CORE_TOKEN` of 32–256 characters in ignored `.dev.vars` or approved server-side secret storage. Call with `Authorization: Bearer <server-only token>`. Do not put this token into a customer browser. This is one internal service principal, not customer authentication, multi-tenant authorization, or Hosted route admission.

- `POST /api/transaction-core/checkouts`: `Idempotency-Key` required (16–128 ASCII letters/digits/`._:-`); JSON body only `offer_id`, integer `quantity`, bounded `source_channel`, optional opaque UUID `customer_reference`. Maximum body 2048 bytes. Source is an attribution label supplied by the trusted service, not a verified marketplace identity. No PII is collected.
- Successful create: 201 `{ data: { checkout, order, replayed: false } }`; matching retry: 200 with `replayed: true`; changed payload with the same key: 409.
- `GET /api/transaction-core/checkouts/:id` and `GET /api/transaction-core/orders/:id`: protected safe DTOs, no private delivery/customer reference, idempotency key/hash, or version metadata.
- Disabled/incomplete/production configuration: 503; bad/missing authorization: 401; malformed input: 400; missing/inactive offer: 404; oversized body: 413; generic unexpected error: 500. Errors include `error`, safe `message`, and request ID.
- `/ready` additionally probes transaction tables when the flag is enabled; default foundation readiness and catalog contracts remain unchanged.

The internal credential authorizes all checkpoint records; this is intentionally **not a production/customer access policy**. No public transaction rate limiter is implemented. Public exposure is forbidden until authorization/rate limits, full lifecycle, and release gates are reviewed. Current response snapshots do not imply payment or product delivery.

### Checkpoint deployment state

No remote migration, deploy, project creation, secret update, or DNS change was performed for this partial checkpoint. Existing BYOK production remains Phase 1 at `efd5d7d8408646f04e0a72afd52849ba6b550a07` on https://webapp-3-38j.pages.dev. Pages audit confirmed main branch, production DB binding, and no preview DB binding. Project `tolvey` returns 404 **in this account**; global `tolvey.pages.dev` availability/allocation is not verified, and canonical identity has not been achieved. Preserve the existing project until a deliberate release/identity decision; never use a random new production hostname or production D1 for staging.

## Verified foundation — PHASE 1 — FOUNDATION

Implemented and verified on 2026-09-30:
- TypeScript/Hono runtime built for Cloudflare Pages advanced-mode Worker, without Node APIs in application code.
- Real D1 schema and migration for `Product`, `ProductVersion`, and `Offer`.
- Server-only D1 bindings, explicit environment configuration, health/readiness, and read-only public catalog APIs.
- Minimal foundation status page. It explicitly states that purchasing/payment/delivery are unavailable; it is not a commerce demo.
- `DRAFT` / `ACTIVE` / `ARCHIVED` lifecycle. Draft/archived records are hidden; offers require active product and version as well.
- Deterministic integer money, relational/uniqueness constraints, bounded pagination, generic errors, request IDs, and structured logs.
- 69 automated tests including real local D1 and the compiled Worker running on workerd.
- BYOK deployment with schema verified in remote D1. Production contains zero catalog records, no fixtures or transactions.

Not implemented in Phase 1: product-family/asset tables, operator/admin API or authentication, storefront purchase experience, checkout, orders, payments, Duitku, fulfillment, distribution integrations, analytics/events, or customer workflows. The Phase 2 checkpoint above adds limited non-production transaction persistence/reads only. No customer can purchase through this foundation. No marketplace/seller infrastructure exists. Full commerce production readiness has not been established.

Phase 0 is preserved in [the audit](docs/15-genspark-build-phases.md), committed at `25feb61f1f453df5b73922bb39886047317fa3d1`. The latest explicit Phase 1 command supersedes the previous storefront/operator requirements and externally named subdivisions: this is **one Phase 1**, with no public mutation surface.

## URLs and routes

- GitHub: https://github.com/Sparkmind-obp-off/Tolvey (branch `main`).
- BYOK foundation: https://webapp-3-38j.pages.dev
- Intended business domain: `tolvey.biz.id`; no custom domain/DNS change was performed in this session.
- Sandbox preview: obtained dynamically from port 3000; temporary and not a production dependency.

| Route | Behavior |
| --- | --- |
| `GET /` | Foundation status and verification links |
| `GET /health` | Process liveness, 200, independent of D1 |
| `GET /ready` | 200 only with valid APP_ENV, D1 binding, and all required catalog columns; otherwise generic 503 |
| `GET /api/products?limit=20&after=<UUID>` | Active product page; limit 1–50, optional keyset cursor |
| `GET /api/products/:id` | Active product by UUIDv4; malformed 400, hidden/missing 404 |
| `GET /api/offers?limit=20&after=<UUID>` | Active offers whose product and version are both active |
| `GET /api/offers/:id` | Public offer DTO, no delivery reference or version metadata |
| `GET /static/style.css` | Public static CSS |

Lists return `{ "data": [], "next_cursor": null }` when no active records exist. Single-record responses use `{ "data": {...} }`. Unknown application/API routes return JSON 404; invalid queries return 400. Application mutation methods return 405 with an Allow header, except the explicitly protected non-production transaction checkpoint create route described above. HEAD is bodyless; OPTIONS returns 204 without permissive CORS. Static asset handling is managed by Pages, not a public database mutation path.

## Local development / Foundation Gate

Requires Node >=22.12 and npm. Exact dependency tree is locked in `package-lock.json`.

```sh
npm ci
npm run build
npm run db:migrate:local
npm test
npm run typecheck
npm run format:check
# Optional, local development fixtures only — not real products:
npm run db:seed:local
npm run dev
```

`npm test` builds first, then runs source/API/D1 tests, repository safety tests, and compiled workerd regression tests. `npm run check` runs typecheck, configured formatting checks, tests, and build. No separate lint tool is configured; formatting excludes historical Markdown and SQL.

In this sandbox, start the daemon only after building:

```sh
pm2 start ecosystem.config.cjs
curl http://localhost:3000/health
curl http://localhost:3000/ready
pm2 logs tolvey --nostream
```

PM2 configuration uses `/home/user/webapp` and an explicit Node CLI invocation; it is local development tooling, not the deployed runtime. Logs and local DB state are ignored. The local Wrangler command uses `APP_ENV=local` and emulated D1; it does not query production D1. The optional `.dev.vars.example` is safe to copy to ignored `.dev.vars`; no secret is needed for foundation reads.

Without the seed, a freshly migrated local DB is ready and returns empty catalogs. Test suites create isolated ephemeral D1 databases from the actual migration, not a mock catalog. The seed is clearly `[TEST]`-labelled and the only seed script includes `--local`.

## Data model and money contract

- `products`: UUID identity, unique lowercase slug, name, summary, status, UTC creation/update timestamps.
- `product_versions`: UUID, product FK, unique `(product_id, version)` label, status, private object JSON metadata, timestamps.
- `offers`: UUID, product/version composite FK (prevents cross-product linkage), name, `price_minor`, currency, `currency_exponent`, status, private opaque `delivery_reference`, timestamps.

Tables use SQLite STRICT typing, CHECK constraints, indexed public reads, and restrictive foreign-key deletes. The default status is DRAFT. Only Offer owns sale price. `price_minor` is a nonnegative integer <= `Number.MAX_SAFE_INTEGER`; there are no float monetary columns. The fixture's 20000 IDR uses exponent 0 (whole rupiah); 1999 USD with exponent 2 represents USD 19.99. Exponent is explicit, not inferred by the browser. Currency format is three uppercase letters; permitted currency/exponent business policy must be established before checkout is added.

Delivery reference stores an opaque future configuration identifier, **not a signed URL, token, or delivery implementation**. Neither it nor private version metadata is exposed publicly. Product families and assets remain planned; transaction entities are now introduced by migration 0002 for the non-production Phase 2 checkpoint. UUIDs can be generated with Web Crypto `crypto.randomUUID()`. Trusted operator SQL must use valid UUIDv4 IDs and update `updated_at` when editing; Phase 1 had no write service, publication workflow, or version-immutability enforcement; Phase 2 now freezes versions once checkout references exist, without adding a catalog publication service.

## Environment and deployment boundaries

- Local: explicit APP_ENV override and local Wrangler D1 state.
- Test: APP_ENV=test, isolated ephemeral Miniflare/workerd D1, never remote DB.
- Production: APP_ENV=production and `DB` binding to the newly created `tolvey-production` D1 database.
- Preview/staging: APP_ENV=staging, **no DB binding**; readiness/catalog fail closed with 503. A remote staging DB could not be created because the account's D1 quota is full. Do not attach production D1 to preview to work around this limit.

`wrangler.jsonc` contains a non-secret database ID, not credentials. BYOK tokens belong in approved account/environment secret storage, never this repository. `.gitignore` excludes credentials, private keys, local databases, dependencies, logs, and generated output. Do not place secrets into SQL, product metadata, fixtures, or static assets.

Production operations require a valid BYOK token loaded securely and D1/Pages permissions. **The sequence below is the historical Phase 1 deployment procedure, not approval to release the partial Phase 2 checkpoint. Do not apply migration 0002 remotely or deploy this checkpoint before its release review and docs/25 identity decision.**

```sh
# Explicit remote schema operation; never run local test fixtures remotely.
npm run db:migrate:production
npm run check
npx wrangler pages deploy dist --project-name webapp-3 --branch main
```

The new Pages project name is `webapp-3` (actual assigned hostname `webapp-3-38j.pages.dev`) because existing `webapp` and `webapp-2` projects were unrelated and left untouched. No Node compatibility flag is needed. No provider/API secret is used by the foundation. Schema is never applied automatically in an HTTP request.

## Verification and limitations

Verified: clean `npm ci`; 69 tests; typecheck; Prettier; build (Worker ~30.24 kB); local and remote migration success; reruns with no pending migrations; FK checks; local persistent fixture reads; live foundation health/readiness/catalog/error/mutation checks; browser rendering without console messages. The generated build wrapper initially lost the source not-found handler; an explicit terminal route and compiled-worker regression tests corrected this before final delivery.

Limited pattern/history/current-token scanning is a secret hygiene check, not a complete security audit. npm audit reported zero known vulnerabilities at verification time. Wrangler currently pins its upstream Miniflare 5 alpha dependency; the exported compatibility converter is used and both simulator and actual deployed runtime were tested. Dependency upgrades must re-run all tests.

Commerce E2E, Duitku/provider tests, recovery/rollback rehearsal, full access-control auditing, and real transaction validation were not performed and must not be inferred from the foundation deployment. No remote staging DB exists. Git commit SHA, successful push, and final clean working-tree evidence are delivered in the session report.

## Next major phase

Continue **PHASE 2 — TRANSACTION CORE** from this verified checkpoint. Next bounded execution objective: atomic provider-neutral payment/state transition orchestration with idempotency, authoritative signal checks, expiry/cancellation handling, and concurrency tests. Do not add Duitku or real delivery. Phase 2 remains incomplete until its full lifecycle/security/release gate passes. Remote staging remains an operational prerequisite to address before provider sandbox work; do not delete unrelated databases without explicit approval.
