# TOLVEY — Product Architecture

## Purpose

Define how TOLVEY turns a validated problem into a repeatable product.

## Product hierarchy

Master Brand → Product Family → Single Product → Kit → Bundle → Complete System

Each sellable item resolves to a ProductVersion and Offer. Free/discovery products sit in Layer 0; reusable paid products are Layer 1; distribution is a separate cross-cutting layer; implementation/custom work belongs to Layer 2.

Example: TOLVEY → Money → Money Kit → v1 → Standard Offer → templates + guide + dashboard + supporting assets.

## Product lifecycle

1. Demand signal
2. Problem definition
3. Customer/job-to-be-done hypothesis
4. Product concept
5. Offer design
6. Build
7. QA
8. Publish
9. Distribution
10. Transaction
11. Feedback
12. Iteration
13. Archive or scale

## Product record

The wider product specification should eventually include product_id, family, name, audience, problem solved, promise, included assets, format, version, cost assumptions, delivery method, supported channels, status, evidence, owner, created_at, updated_at. Commercial price belongs to Offer; any product display price must be derived, never a second monetary source.

## Implemented minimum — Phase 1, 2026-09-30

- Product: UUID, name, unique slug, summary, lifecycle, timestamps.
- ProductVersion: UUID, product FK, unique version label per product, lifecycle, object JSON metadata, timestamps.
- Offer: UUID, matched product/version FK, name, integer `price_minor`, explicit currency/exponent, lifecycle, private opaque delivery reference, timestamps.
- Lifecycle: DRAFT (default), ACTIVE, ARCHIVED. Public read APIs hide inactive records; an offer also requires active parent product/version.
- Money: nonnegative integer bounded by JavaScript safe-integer range; test fixture 20000 IDR uses exponent 0, and 1999 USD/exponent 2 is verified. No floating monetary storage or real production price is seeded. Currency/exponent business policy precedes later checkout.

This is the minimal canonical data foundation, not the complete wider product record. Product families/assets, immutable version publication rules, demand evidence, operator mutation/authentication, real Money Kit content, and delivery remain planned. Test fixtures are not commercial evidence.

## Phase 2 snapshot boundary — 2026-09-30

The locally verified transaction checkpoint freezes ProductVersion identity/content after first checkout references it, while allowing lifecycle archival. Checkout/order purchase snapshots preserve version label, price/currency/exponent, product/offer names and private delivery reference. Referenced offers cannot be repointed to another version; create a new offer. This does not expand the product catalog or implement a full publication/version-release workflow.

## Product principles

- Sell outcomes, not feature piles.
- Start small enough to ship.
- Every product needs a clear buyer and use case.
- Product evidence beats internal enthusiasm.
- One canonical product definition should feed every channel.
