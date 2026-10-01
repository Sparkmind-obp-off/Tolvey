# TOLVEY — Technical Architecture

## Current implementation boundary — 2026-10-01

Current source/release: `d73a4df`. Foundation is deployed, local/test transaction lifecycle and POP adapter are implemented, and private production connection authentication/secrets are deployed. Production transaction execution remains disabled. Remote transaction schema/customer commerce/private delivery/operator publication are not complete. Current master full cycle and technical choices: docs/19; prioritized dependencies: docs/15. Component/entity/event inventories below are targets, not all implemented tables or routes.

## Architecture principle
Keep the system modular and simple. TOLVEY should own the canonical product and commerce model while external platforms remain replaceable channel adapters.

## Core components
1. Brand/Web — public presentation and conversion surfaces.
2. Product Hub — canonical products, versions, offers, assets, and lifecycle.
3. Commerce Hub — checkout destinations, orders, fulfillment, customer references, and revenue signals.
4. Distribution Hub — channel registry, listings, adapters, publishing, and channel performance.
5. Intelligence — demand signals, experiments, scoring, and learning.
6. Operator Console — operational visibility and controlled actions.

## Core entities
Product, ProductVersion, Offer, Channel, ChannelListing, Order, OrderItem, CustomerReference, Fulfillment, DemandSignal, Experiment, Event, Asset.

## Integration pattern
Canonical internal model → channel adapter → external platform.

Never make a marketplace schema the internal source of truth.

## Important events
- product.created
- product.published
- listing.published
- order.created
- payment.confirmed
- fulfillment.completed
- refund.created
- demand.captured
- experiment.updated

## Reliability
Use idempotency for transaction and webhook processing. External callbacks must be validated, authenticated where supported, deduplicated, and observable.

## Production direction
The architecture should remain compatible with a Cloudflare-based production stack and must not depend on a single AI sandbox for core business operations.

## Engineering build order
Clarified by the Phase 0 audit on 2026-09-30. Use the gated execution plan in `docs/15-genspark-build-phases.md`, not a storefront-first implementation:

0. Repository and architecture audit.
1. Foundation: TypeScript/Hono/Pages runtime, safe environment configuration, D1 canonical Product/ProductVersion/Offer schema and migrations, health/readiness, read-only APIs, and automated tests with complete build/migration/Git gate. The latest Phase 1 command defers storefront and operator HTTP mutations/authentication.
2. Provider-neutral transaction core: CheckoutSession, Order, Payment, Fulfillment, CustomerReference, Event, atomic transitions, idempotency, and audit trail.
3. Duitku POP adapter and verified sandbox end-to-end evidence using current official documentation.
4. Real product assets, customer delivery, and product-to-commerce evidence.
5. Selected distribution channels from the same canonical source.
6. Operational security and observability hardening.
7. Controlled production validation and rollback checks.
8. Optimization only after real evidence.

Minimum secret isolation, authorization where required, and input validation apply from the first implemented endpoint; Phase 6 does not defer these controls.

## Historical implemented Foundation snapshot — 2026-09-30

- Entry: `src/index.ts`; modules `src/config.ts`, `src/catalog.ts`, `src/types.ts`. No Node APIs or Node compatibility flags in the deployed application.
- Build: Hono/Vite Pages advanced-mode Worker (`dist/_worker.js`), generated `_routes.json`, public static CSS. An explicit terminal route preserves JSON 404 through the build plugin's outer Hono wrapper.
- D1: `DB` binding; `migrations/0001_canonical_catalog.sql`; three STRICT domain tables only. Composite FK on Offer prevents cross-product version linkage. Price exists only on Offer, as integer minor units with explicit currency/exponent. Lifecycle default DRAFT, no automatic publication.
- Reads: health/readiness; active products; offers with active product/version/offer; limits 1–50 and optional UUID keyset cursor. Version metadata and opaque delivery reference stay private. There is no version API or delivery authorization.
- Operational writes: trusted Cloudflare/D1 operator tooling only. No public admin/write endpoints, no implemented auth/publication service or version immutability enforcement. Operators must preserve UUIDv4 and timestamp conventions; supported currency/exponent business policy must be settled before checkout.
- Errors/logging: UUID request IDs, structured bounded log fields, generic errors, no raw credentials/query/payload/SQL error text. Security headers apply to application responses; Pages serves static CSS.
- Environments: local D1 state; ephemeral test/workerd D1; production `tolvey-production`; preview/staging no DB binding (fail closed). Remote staging awaits database quota capacity.
- Deployment: new BYOK Pages project `webapp-3`, assigned URL https://webapp-3-38j.pages.dev; empty production catalog. Existing unrelated resources and business DNS were not changed.

The wider component/entity/event lists above are planned architecture, not all implemented features. There are no transaction or marketplace tables, payment/provider adapters, fulfillment workers, event bus, analytics platform, storefront purchase flow, or operator dashboard in Phase 1.
