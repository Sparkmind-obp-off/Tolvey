# TOLVEY Commercial Architecture Master

Status: Architecture lock candidate
Version: v1.0
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

## 5. Core commercial entities
Product, ProductVersion, Offer, Bundle, Asset, License, DistributionChannel, ChannelListing, Customer, CheckoutSession, Order, Payment, Fulfillment, Event.

## 6. Source of truth
Internal catalog is authoritative for product identity, version, contents, license, pricing hypothesis, fulfillment and commercial status. Channel listings are derived representations.

## 7. Validation
Evidence progresses from demand signal → offer interaction → checkout intent → payment → fulfillment → repeat purchase → repeatable channel.

Views, likes, downloads or listing existence alone are not product-market-fit evidence.

## 8. Architecture constraints
- No marketplace-specific logic in the product domain.
- No payment-provider assumptions in product definitions.
- No duplicated product truth across channels.
- No unsupported income claims or fake testimonials.
- Verify third-party asset rights and licenses.
- Custom scope must not leak into standard products.
- Fulfilled purchases reference an immutable product version.
- Service customization does not silently mutate the master product.

## 9. V1 objective
Prove a small number of products can attract demand, convert, fulfill cleanly and generate evidence before expanding catalog breadth.
