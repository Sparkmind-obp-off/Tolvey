# TOLVEY Distribution Operations & Attribution

Status: Distribution operations specification
Version: v1.0
Updated: 2026-09-30

## Purpose
Make multi-channel distribution measurable without creating multiple sources of truth.

## Manual first-channel intake — specification 2026-10-01

One eligible commerce storefront and one primary demand channel first. Owner records country/account/product category, official policy URL/review date, fees/payout/refund/delivery conditions, version/offer/listing mapping and next review. Source/campaign/creative labels are bounded; missing attribution remains UNKNOWN, not assumed direct sales.

External checkout owns external payment truth. Verify actual channel order/export/dashboard evidence, capture unique `(channel, external_order_id)`, canonical product/version, amount/currency, verified payment/fulfillment/refund facts, fees/payout status, evidence reference/time and verifier. Deduplicate imports and reject changed meaning; never create a second Duitku invoice or fake own CheckoutSession to force current schema. Unique external-origin intake/read projection requires future additive implementation (docs/19/22).

Before D1 intake exists, an authorized manual pilot can use a restricted structured evidence register, explicitly labeled provisional/not normalized, with stable IDs reconciled on later import. It is not an independent product master or claimed application revenue pipeline. Buyer screenshots, click-outs, or listing counters are not authenticated payment evidence. No public arbitrary CSV/state import; imports require operator authorization, validation and audit.

Weekly review includes comparable offer cohorts, verified gross paid/refunds/fees/variable costs, fulfillment/support and attribution completeness (docs/27). No return-on-ad-spend claim if spend/conversion evidence is absent. Paid ads have explicit budget approval and stop rule. Instagram/TikTok/other social demand is not the same as marketplace checkout eligibility; current Indonesia TikTok Shop digital/service restriction is documented in docs/32.

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
