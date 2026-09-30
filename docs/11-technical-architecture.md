# TOLVEY — Technical Architecture

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
1. Foundation: Cloudflare-compatible shell, environment configuration, persistent canonical Product/ProductVersion/Offer catalog, basic storefront, and protected operator foundation.
2. Provider-neutral transaction core: CheckoutSession, Order, Payment, Fulfillment, CustomerReference, Event, atomic transitions, idempotency, and audit trail.
3. Duitku POP adapter and verified sandbox end-to-end evidence using current official documentation.
4. Real product assets, customer delivery, and product-to-commerce evidence.
5. Selected distribution channels from the same canonical source.
6. Operational security and observability hardening.
7. Controlled production validation and rollback checks.
8. Optimization only after real evidence.

Minimum secret isolation, authorization, and input validation apply from the first implemented endpoint; Phase 6 does not defer these controls.
