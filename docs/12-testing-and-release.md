# TOLVEY — Testing & Release

## Test layers
### Product
Validate product records, versions, offers, assets, pricing, delivery instructions, and publication state.

### Commerce
Validate checkout handoff, order creation, payment state, fulfillment, refunds, and customer-facing delivery.

### Distribution
Validate channel mappings, listing content, identifiers, pricing, availability, and import/export or adapter behavior.

### Security
Validate secret handling, access control, webhook validation, input validation, rate limiting, logging hygiene, and production/dev separation.

## Critical end-to-end test
Demand signal → Product → Offer → Storefront → Checkout → Order → Fulfillment → Customer receipt/use → Analytics.

## Release gates
A release is production-ready only when:
- tests pass;
- no critical security issue remains;
- production secrets are stored safely;
- rollback is defined;
- monitoring/logging is available;
- customer-facing copy is verified;
- payment and fulfillment paths are verified.

## Rollback
Rollback application behavior without deleting or corrupting transaction records. Preserve order, payment, fulfillment, and audit history needed for reconciliation.

## Operational rule
Prefer small, reversible releases. Ship the smallest change that proves or improves a real business workflow, then observe before expanding scope.
