# TOLVEY — Product Requirements Document (PRD)

## 1. Product definition
TOLVEY is a Product House Hub + Commerce House Hub for TOLVEY-owned products.

It turns validated demand into products, offers, distribution, transactions, fulfillment, and learning.

TOLVEY is not initially a multi-vendor marketplace.

## 2. Problem
Product creation, packaging, distribution, checkout, fulfillment, and learning are often fragmented across unrelated tools and channels. TOLVEY provides one canonical product/commercial source while allowing multiple distribution channels.

## 3. Primary users
- Operator/founder: creates products, controls offers, observes transactions, and learns from evidence.
- Customer: discovers a TOLVEY product, understands the offer, purchases through an approved checkout path, and receives/uses the product.
- Distribution partner/channel: exposes TOLVEY-owned offers while remaining an external channel adapter.

## 4. Jobs to be done
### Operator
- Turn a validated problem into a clear product.
- Publish a trustworthy offer.
- Sell through owned and external channels.
- Know what happened to every transaction.
- Improve products from real evidence.

### Customer
- Understand what the product solves.
- Evaluate the offer and price.
- Complete checkout safely.
- Receive the promised outcome.
- Give feedback.

## 5. Product principles
- Demand before scale.
- Canonical source before channel duplication.
- Offer is the commercial price authority.
- Server-side truth for money and payment.
- Real evidence before automation.
- Small, reversible releases.
- No marketplace complexity without a demonstrated need.

## 6. Product hierarchy
TOLVEY → Product Family → Product → Product Version → Offer → Asset/Delivery.

## Minimum first-loop acceptance — audit enhancement 2026-10-01

Three engines remain Own Commerce, Distribution and Brand/Demand (docs/39/34). Implement one candidate, not every family. The customer can understand approved package/version/license/terms; publication is controlled; checkout/status/download require scoped ownership and abuse protection; payment is provider-verified; delivery uses pinned private assets; operator sees exceptions/support/recovery. Services initially use scoped inquiry, not instant DIGITAL fulfillment. External orders preserve channel-owned checkout evidence and unique source IDs.

These requirements are target acceptance, not current implemented capability. Integrated non-production loop precedes separately authorized controlled production release; real customer validation requires independent use/economics evidence. Current gaps/status/dependencies: docs/15; full-cycle contract: docs/19; MVP: docs/06.

## 7. V1 capability map
### Foundation
Product, ProductVersion, Offer, D1, read APIs, Cloudflare runtime.

### Commerce
CheckoutSession, Order, Payment, Fulfillment, state machine, idempotency.

### Payment
Provider-neutral adapter followed by Duitku POP.

### Delivery
Verified product delivery/customer outcome.

### Distribution
Canonical export/listing/channel attribution.

### Operations
Events, audit trail, observability, security, recovery.

## 8. Non-goals
- Multi-vendor marketplace
- Seller accounts/wallets/escrow
- Full ERP/accounting replacement
- Custom payment processing
- Premature microservices
- Every marketplace integration at once

## 9. Success criteria
The product system is commercially proven only when a real customer can discover → purchase → receive/use a TOLVEY product and the operator can observe the transaction end-to-end.

Technical completion and commercial validation must remain separate claims.

## 10. Initial product hypothesis
Money Kit is an initial product-family hypothesis. It is not evidence of demand, a guaranteed winner, or a production offer until validated.
