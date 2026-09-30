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

## Build order
1. Storefront
2. Product data
3. Offer and checkout
4. Fulfillment
5. Order visibility
6. Distribution registry
7. Analytics
8. Automation
9. Advanced integrations
