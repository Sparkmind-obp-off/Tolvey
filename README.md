# TOLVEY

**Product House Hub + Commerce House Hub** for TOLVEY-owned products, initially serving Indonesia. Money Kit remains a product hypothesis, not an implemented commercial offer or evidence of demand.

One canonical product source -> many commerce/distribution channels -> one normalized transaction model -> one operational truth.

Demand -> Product -> Package -> Publish -> Distribute -> Sell -> Deliver -> Measure -> Learn -> Improve.

## Current implementation — PHASE 1 — FOUNDATION

Implemented and verified on 2026-09-30:
- TypeScript/Hono runtime built for Cloudflare Pages advanced-mode Worker, without Node APIs in application code.
- Real D1 schema and migration for `Product`, `ProductVersion`, and `Offer`.
- Server-only D1 bindings, explicit environment configuration, health/readiness, and read-only public catalog APIs.
- Minimal foundation status page. It explicitly states that purchasing/payment/delivery are unavailable; it is not a commerce demo.
- `DRAFT` / `ACTIVE` / `ARCHIVED` lifecycle. Draft/archived records are hidden; offers require active product and version as well.
- Deterministic integer money, relational/uniqueness constraints, bounded pagination, generic errors, request IDs, and structured logs.
- 69 automated tests including real local D1 and the compiled Worker running on workerd.
- BYOK deployment with schema verified in remote D1. Production contains zero catalog records, no fixtures or transactions.

Not implemented: product-family/asset tables, operator/admin API or authentication, storefront purchase experience, checkout, orders, payments, Duitku, fulfillment, distribution integrations, analytics/events, or customer workflows. No customer can purchase through this foundation. No marketplace/seller infrastructure exists. Full commerce production readiness has not been established.

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

Lists return `{ "data": [], "next_cursor": null }` when no active records exist. Single-record responses use `{ "data": {...} }`. Unknown application/API routes return JSON 404; invalid queries return 400. Application mutation methods return 405 with an Allow header. HEAD is bodyless; OPTIONS returns 204 without permissive CORS. Static asset handling is managed by Pages, not a public database mutation path.

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

Delivery reference stores an opaque future configuration identifier, **not a signed URL, token, or delivery implementation**. Neither it nor private version metadata is exposed publicly. Product families, assets and transaction entities remain planned, not speculative extra tables. UUIDs can be generated with Web Crypto `crypto.randomUUID()`. Trusted operator SQL must use valid UUIDv4 IDs and update `updated_at` when editing; this phase has no write service, publication workflow, or version-immutability enforcement.

## Environment and deployment boundaries

- Local: explicit APP_ENV override and local Wrangler D1 state.
- Test: APP_ENV=test, isolated ephemeral Miniflare/workerd D1, never remote DB.
- Production: APP_ENV=production and `DB` binding to the newly created `tolvey-production` D1 database.
- Preview/staging: APP_ENV=staging, **no DB binding**; readiness/catalog fail closed with 503. A remote staging DB could not be created because the account's D1 quota is full. Do not attach production D1 to preview to work around this limit.

`wrangler.jsonc` contains a non-secret database ID, not credentials. BYOK tokens belong in approved account/environment secret storage, never this repository. `.gitignore` excludes credentials, private keys, local databases, dependencies, logs, and generated output. Do not place secrets into SQL, product metadata, fixtures, or static assets.

Production operations require a valid BYOK token loaded securely and D1/Pages permissions:

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

Only after final Foundation Gate/Git delivery passes: **PHASE 2 — TRANSACTION CORE**, starting with provider-neutral transaction persistence, state transitions and idempotency tests. No Phase 2 code was implemented here. Remote staging remains an operational prerequisite to address before provider sandbox work; do not delete unrelated databases without explicit approval.
