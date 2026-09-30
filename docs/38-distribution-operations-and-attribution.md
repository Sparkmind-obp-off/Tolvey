# TOLVEY Distribution Operations & Attribution

Status: Distribution operations specification
Version: v1.0
Updated: 2026-09-30

## Purpose
Make multi-channel distribution measurable without creating multiple sources of truth.

## Channel lifecycle
DISCOVERED → APPROVED → LISTED → ACTIVE → PAUSED → RETIRED.

## Per-channel checklist
- policy reviewed
- seller account ready
- product eligible
- listing created
- delivery tested
- purchase tested where possible
- analytics/attribution configured
- owner assigned
- review date recorded

## Attribution
Use a canonical product ID plus channel/source/campaign identifiers.

Suggested conceptual dimensions:
product_id, product_version, channel, source, campaign, creative, landing_surface.

## Metrics
- impressions/views
- product visits
- free downloads
- add-to-cart/checkout intent where available
- paid orders
- conversion rate
- gross revenue
- refunds
- fulfillment failures
- support contacts
- repeat purchases
- service inquiries

## Operating rule
Do not compare channels using raw sales alone when traffic, price, promotion or audience differs.

## Policy review
Platform rules change. Record the last review date and re-check eligibility before materially changing a listing.
