# TOLVEY — Data & D1 Architecture

## 1. Data principle
D1 is the canonical structured operational store for TOLVEY's application state.

It is not automatically the complete accounting ledger, analytics warehouse, asset store, or external-provider database.

## 2. Canonical hierarchy
Product
→ ProductVersion
→ Offer
→ CheckoutSession
→ Order
→ Payment
→ Fulfillment.

Additional operational entities:
CustomerReference, Channel, ChannelListing, Event, Asset.

Only entities required by the current phase should be persisted.

## 3. Phase 1 tables
### products
Canonical product identity.

### product_versions
Version/revision of a product.

### offers
Commercial offer and authoritative sale price.

## 4. Phase 2 planned transaction tables
- checkout_sessions
- orders
- payments
- fulfillments
- idempotency records where needed
- transaction/audit events

The exact schema must be designed with atomic transition and retry behavior, not merely copied from the conceptual architecture.

## 5. Integrity
Use:
- foreign keys
- composite relationships where needed
- unique constraints
- CHECK constraints
- explicit lifecycle states
- deterministic timestamps
- safe integer money representation

## 6. Money
Never use floating-point database money.

Use:
price_minor + currency + currency_exponent

The Offer is the authoritative sale-price source.

## 7. JSON
Use JSON metadata only for bounded, non-relational metadata where it does not weaken core integrity.

Important queryable business fields should be first-class columns.

## 8. Migrations
- additive by default
- reviewed before remote application
- tested on fresh database
- tested on representative existing schema
- no destructive rollback assumed
- transaction history must never be deleted as a rollback strategy

## 9. Environments
Local/test must use isolated databases.

Preview currently fails closed without D1 because remote staging quota is unavailable.

Production uses the dedicated TOLVEY production D1 binding.

Never use production as a test fixture database.

## 10. Data retention
Retention rules must be defined by data class before collecting customer/payment information.

Separate:
- operational transaction records
- customer-provided data
- provider references
- audit events
- analytics aggregates
- private assets

Collect the minimum data needed.

## 11. Backup/recovery
Before production commerce:
- define D1 recovery/export strategy
- define migration recovery
- define application rollback
- preserve transaction/audit records
- rehearse recovery on non-production data
