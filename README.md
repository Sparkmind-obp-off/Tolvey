# TOLVEY

TOLVEY is a **Product House Hub + Commerce House Hub**.

It is the owned operating layer for creating, packaging, publishing, distributing, selling, and learning from TOLVEY products across owned and external channels.

## Current positioning

- Master brand: TOLVEY
- Role: Product House Hub + Commerce House Hub
- Primary market: Indonesia
- Initial product direction: practical product kits, starting with Money Kit
- Distribution: owned storefront plus selected marketplaces, social commerce, affiliates, and other verified channels
- Architecture principle: one product source, many distribution channels
- Business model: own products first; multi-vendor marketplace is explicitly out of scope for V1
- Domain: tolvey.biz.id
- Status: brand locked operationally after manual clearance work; legal protection/registration remains a separate professional process

## Core loop

Demand -> Product -> Package -> Publish -> Distribute -> Sell -> Deliver -> Measure -> Learn -> Improve

## V1 objective

Prove that TOLVEY can repeatedly turn validated demand into sellable products and distribute those products through multiple channels without duplicating the product operating system.

## Non-goals for V1

- Multi-vendor marketplace
- Seller onboarding
- Escrow
- Seller commissions
- Complex recommendation engine
- Full ERP
- Premature microservices
- Building every marketplace integration before a real transaction requires it

See docs/ for the canonical architecture, product model, commerce model, distribution strategy, MVP, security, validation, roadmap, and decision log.

## Verified repository state — Phase 0 audit, 2026-09-30

The audited main snapshot `832e4a4e189a3897e3bbde104e72222811235e0a` contains this README and 16 architecture/business documents only. There is **no executable application, database migration, test suite, or Cloudflare deployment configuration**. Documentation is not evidence of working commerce.

Completed this session:
- Read and audited all repository documentation and tracked-file inventory.
- Recorded gaps, risks, verification evidence, and bounded build order in [the phase plan](docs/15-genspark-build-phases.md).
- Clarified business milestone numbering versus engineering phases in [the roadmap](docs/09-roadmap-and-decisions.md).
- Aligned [technical build order](docs/11-technical-architecture.md) with canonical foundation before transaction/provider work.

Not implemented: canonical catalog persistence, product/version/offer APIs, storefront, operator authentication, checkout, provider-neutral transaction core, Duitku adapter, fulfillment, distribution adapters, or runtime analytics. No real payment, delivery, or customer validation is claimed. Money Kit remains a hypothesis.

## Entry URIs and usage

- GitHub: https://github.com/Sparkmind-obp-off/Tolvey
- Functional application/API paths and parameters: none yet.
- Intended primary domain: https://tolvey.biz.id — domain/DNS/live site not independently verified by this audit.
- Production application URL from this session: none; no deployment performed.

For now, use the repository as a specification: read docs/01–16, then the audit section of docs/15. Engineering phases in docs/15–16 govern execution; docs/09 records business milestones. There is no install/run/checkout command until the foundation exists.

## Data architecture

Planned canonical hierarchy: TOLVEY -> Product Family -> Product -> ProductVersion -> Offer -> Asset/Delivery. Planned provider-neutral transaction entities: CheckoutSession, Order, Payment, Fulfillment, CustomerReference, Event. These are specifications only, not persisted records.

Recommended foundation: Hono + TypeScript on Cloudflare Pages with D1 for persistent canonical product/version/offer data; R2 later for private delivery assets when required. No storage resources or bindings were created. Offer must be the authoritative sale-price source; pending internal orders must precede provider initiation when Phase 2 is designed.

## Deployment and next gate

- Requested path: user's own Cloudflare account (BYOK).
- GitHub credential setup and Cloudflare BYOK credential setup succeeded in this session. Cloudflare Wrangler authentication/permissions and existing resources were not independently checked.
- Deployment status: blocked by absence of a runnable project/build output. No application, DNS, or Cloudflare project changes were made.
- Production readiness: not established; no commerce test gates passed.

**Next bounded session — Phase 1A:** establish the Hono/TypeScript/Cloudflare Pages shell, secret-safe ignore/environment configuration, and D1 Product/ProductVersion/Offer migrations with validation tests. Gate: clean build and migration/integrity tests pass. No payment integration or public operator mutations. Phase 1B then adds canonical catalog publication, basic storefront, and authenticated operator foundation before the complete Phase 1 gate can pass.
