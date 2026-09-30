# TOLVEY — Commerce Architecture

## Principle

TOLVEY owns the commercial system while using external platforms as channels.

## Commerce layers

1. Catalog — canonical product, variant, offer, pricing, media, and availability.
2. Storefront — owned TOLVEY presentation and conversion surface.
3. Transaction — checkout/payment destination and order creation.
4. Fulfillment — digital delivery, physical fulfillment, or service activation.
5. Customer — order history, consent, support state, and permitted customer signals.
6. Analytics — visits, conversion, orders, revenue, refunds, and channel performance.

## Channel model

Owned: TOLVEY website/storefront, TOLVEY direct links, and owned customer communication where consent exists.

External: established marketplaces, social commerce, affiliate/referral channels, creator/community distribution, and other verified channels.

External channels must never become the sole source of truth.

## Order model

Normalize every channel order into a common internal representation: order_id, channel, external_order_id, customer_reference, items, amount, currency, payment_status, fulfillment_status, refund_status, timestamps.

## V1 rule

Do not build deep integrations until a real operational need exists. Start with the smallest reliable ingestion/export/manual workflow and automate the highest-volume repeated work.
