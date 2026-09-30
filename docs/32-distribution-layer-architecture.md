# TOLVEY Distribution Layer Architecture

Status: Channel architecture
Version: v1.0
Updated: 2026-09-30

## Role
Distribution connects canonical TOLVEY products with audiences and compatible commerce surfaces.

Canonical flow:
One Product → Master Asset → Channel Listing/Creative → Audience → Transaction → Fulfillment → Measurement.

## Channel classes

### Owned commerce
**TOLVEY Website**
Canonical catalog, product detail, direct commerce, analytics and service conversion.

### Digital storefront
**Lynk.id**
Link-in-bio/storefront test channel for Indonesian social distribution.

**Gumroad**
Digital-first storefront for direct and potentially international distribution.

### Marketplaces
**Shopee**
Marketplace distribution subject to current digital-product/category rules.

**TikTok Shop**
Commerce + content distribution where the exact product/category is eligible.

**Etsy**
Potential international digital-download channel where product and seller requirements fit.

### Social discovery
- Instagram
- Threads
- TikTok
- X / Twitter

### Search/content
- Google Search
- YouTube

## Priority
Tier 1 execution: TOLVEY Website, Lynk.id, Instagram, Threads, TikTok, X.
Tier 2: Shopee, Gumroad, Google Search, YouTube.
Tier 3: Etsy and later compatible marketplaces.

Priority is an execution order, not a prediction of sales performance.

## Channel record
For each listing maintain channel, listing ID, URL, title, price, product version, publication status, creative version, traffic, sales, refunds and last policy review.

## Policy gate
Before listing any digital product, verify current platform eligibility, delivery rules, fees, seller requirements, external-link rules, prohibited content and applicable tax/consumer obligations.

## Canonical rule
TOLVEY catalog is the product truth. Channel listings are projections of that truth.
