# TOLVEY Commercial Architecture Master

Status: Canonical commercial architecture
Version: v2.0
Updated: 2026-10-01

## Strategic authority

See `docs/39-vision-mission-north-star.md` for the canonical Vision, Mission, North Star, and three-engine business model.

TOLVEY operates three connected engines:

1. **Own Commerce — TOLVEY Shop**
2. **Distribution — External Commerce Channels**
3. **Brand / Demand — Social, Content and Search**

## 1. Own Commerce

The TOLVEY Shop is the official owned commerce destination.

Responsibilities:
- canonical catalog presentation;
- product pages;
- offers;
- checkout;
- payment;
- orders;
- fulfillment;
- customer transaction experience;
- direct commerce evidence.

Flow:

`TOLVEY Brand → Product → Offer → Product Page → Checkout → Payment → Order → Fulfillment`

The own shop is the canonical commercial home, but customers are not required to use it for every purchase.

## 2. Distribution

External commerce platforms provide additional reach and optional checkout paths.

Possible channels:
- Lynk.id;
- Shopee where digital-product eligibility and policy permit;
- Gumroad;
- Etsy where product/channel fit and policy permit;
- other compatible platforms.

Flow:

`Canonical Product → Channel Listing → Channel Traffic → External Checkout / Transaction → Attribution`

Channel admission requires product fit, current policy eligibility, operational feasibility, acceptable economics, fulfillment compatibility, and useful attribution.

External channels are derived representations, never the master product source.

## 3. Brand / Demand

Brand and content channels create awareness, demand signals, trust, product discovery and traffic.

Possible channels:
- Instagram;
- Threads;
- TikTok;
- X;
- YouTube;
- search/content;
- compatible communities.

Flow:

`Content / Community / Search → Interest → Product Discovery → Own Shop or Distribution → Transaction`

Brand work is continuous and does not wait for every engineering phase.

## 4. One product, many doors

Canonical hierarchy:

`Product Family → Single Product → Kit → Bundle → Complete System`

One master product may produce many storefront listings, marketplace listings, external-store listings, social creatives, landing pages and campaign links.

The master catalog remains authoritative for:
- identity;
- version;
- assets;
- license;
- offer;
- commercial status;
- fulfillment definition.

No channel may become an independent product truth.

## 5. Commercial loop

`Demand → Product → Offer → Publish → Distribute → Sell → Deliver → Measure → Learn → Improve`

Valid customer paths include:

`Social → TOLVEY Shop → Duitku → Fulfillment`

`Social → External Storefront → External Checkout → Fulfillment`

`Marketplace Search → Marketplace Listing → Marketplace Checkout → Fulfillment`

`Search → TOLVEY Product Page → TOLVEY Checkout → Duitku`

The destination may differ; product identity and operational truth do not.

## 6. Product architecture

### Layer 0 — Free / Discovery
Free tools, lead magnets, mini-products and educational assets used to create discovery and demand signals. This is a funnel/discovery function, not a separate core revenue engine.

### Layer 1 — Digital Products
Repeatable TOLVEY-owned products:
- Money;
- Business;
- UMKM / Seller;
- Creator;
- Freelancer;
- Solopreneur;
- AI Work;
- Productivity.

Forms:
- Single Product;
- Kit;
- Bundle;
- Complete System.

### Layer 2 — Services
Done-for-you, implementation and custom work. Layer 2 customization must not silently mutate Layer 1 master products.

## 7. Commerce core

Core:

`Product → ProductVersion → Offer → CheckoutSession → Order → Payment → Fulfillment → Event`

Supporting entities include CustomerReference, DistributionChannel, ChannelListing, Asset, License, and attribution/source metadata.

D1 remains canonical persistence for the internal commerce model.

## 8. Payment boundary

Duitku POP is the first direct payment provider.

Boundary:

`TOLVEY Commerce Core → Payment Provider Adapter → Duitku POP`

Provider-specific request, signature, callback, and status logic stays inside the adapter boundary.

## 9. Distribution boundary

The distribution layer is additive.

It may contain:
- channel registry;
- listing metadata;
- canonical product export;
- channel-specific copy/creative;
- channel links/deep links;
- source attribution;
- external order references where feasible.

It must not contain duplicate product truth or marketplace-specific product forks.

## 10. Attribution and validation

Where possible:

`Source → Channel → Product → Listing → Checkout Destination → Transaction → Fulfillment`

Evidence progression:

`Demand Signal → Offer Interaction → Checkout Intent → Payment → Fulfillment → Customer Outcome → Repeat / Repeatable Channel`

Views, likes, listing existence, or a polished UI are not sales validation.

## 11. Architecture constraints

- TOLVEY owns the canonical product source.
- External channels are distribution surfaces.
- Payment providers are adapters.
- Free products are discovery/funnel assets.
- Layer 2 must not silently mutate Layer 1.
- No fake transactions, analytics, testimonials or demand claims.
- No unsupported income claims.
- No multi-vendor marketplace V1.
- No unnecessary microservices.
- No every-channel-at-once integration project.
- Verify channel policy/eligibility before listing.
- Real transaction evidence outranks visual completion.

## 12. V1 objective

Prove that TOLVEY can:
1. create a real product;
2. publish it in the canonical shop;
3. create a valid offer;
4. accept supported payment;
5. fulfill the product;
6. observe the transaction;
7. distribute the same product through additional channels;
8. generate demand through brand/content;
9. use evidence to improve the next decision.

The objective is a working commercial loop, not a large feature inventory.

## 13. Current phase reality

- Phase 1 — Foundation: complete.
- Phase 2 — Transaction Core: complete.
- Phase 3 — Duitku POP: code complete / sandbox blocked.
- Phase 4 — Real Product Commerce: next engineering gate after Phase 3 live verification.
- Phase 5 — Distribution: planned.
- Brand/demand execution: continuous business activity.

No production payment or live sandbox verification may be implied without evidence.
