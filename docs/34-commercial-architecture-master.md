# TOLVEY Commercial Architecture Master

Status: Canonical commercial architecture
Version: v1.1
Updated: 2026-09-30

## 1. Master model

### Layer 0 — Discovery / Free
Free tools, free mini-products, educational content and demand capture.

### Layer 1 — Digital Products
Repeatable products sold and delivered many times.

### Distribution Layer
Owned storefronts, digital storefronts, marketplaces, social discovery and search/content.

### Layer 2 — Services
Done-for-you, implementation and custom work.

## 2. Commercial loop
Discovery → Free Product → Single Product → Kit → Bundle → Complete System → Layer 2 Service → Repeat Purchase / Upgrade.

Not every customer must follow every stage.

## 3. Layer 1 families
- Money
- Business
- UMKM / Seller
- Creator
- Freelancer
- Solopreneur
- AI Work
- Productivity

Forms:
- Single Product
- Kit
- Bundle
- Complete System

## 4. Distribution
Owned: TOLVEY Website.
Digital storefronts: Lynk.id, Gumroad.
Marketplaces: Shopee, TikTok Shop where eligible, Etsy.
Social discovery: Instagram, Threads, TikTok, X/Twitter.
Search/content: Google Search, YouTube.

Future channels are admitted only when audience fit, product compatibility, economics and attribution are clear.

## 5. Product hierarchy and commercial boundaries

Canonical hierarchy:
`Product Family → Single Product → Kit → Bundle → Complete System`

Commercial funnel:
`Free / Discovery → Single Product → Kit → Bundle → Complete System → Layer 2 Service`

Free products are discovery/funnel assets, not a separate revenue layer. Distribution is a cross-cutting delivery/discovery layer, not a product tier. Layer 2 is implementation/custom work and does not mutate Layer 1 master products.

## 6. Core commercial entities
Product, ProductVersion, Offer, Bundle, Asset, License, DistributionChannel, ChannelListing, Customer, CheckoutSession, Order, Payment, Fulfillment, Event.

## 7. Source of truth
Internal catalog is authoritative for product identity, version, contents, license, pricing hypothesis, fulfillment and commercial status. Channel listings are derived representations.

## 8. Validation
Evidence progresses from demand signal → offer interaction → checkout intent → payment → fulfillment → repeat purchase → repeatable channel.

Views, likes, downloads or listing existence alone are not product-market-fit evidence.

## 9. Architecture constraints
- No marketplace-specific logic in the product domain.
- No payment-provider assumptions in product definitions.
- No duplicated product truth across channels.
- No unsupported income claims or fake testimonials.
- Verify third-party asset rights and licenses.
- Custom scope must not leak into standard products.
- Fulfilled purchases reference an immutable product version.
- Service customization does not silently mutate the master product.

## 10. V1 objective
Prove a small number of products can attract demand, convert, fulfill cleanly and generate evidence before expanding catalog breadth.
