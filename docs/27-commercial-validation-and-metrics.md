# TOLVEY — Commercial Validation & Metrics

## Purpose

This document defines how TOLVEY distinguishes product/transaction evidence from assumptions, and how commercial learning is measured without prematurely building a marketplace or large analytics system.

## Core rule

TOLVEY optimizes for evidence of customer value and transaction completion, not feature count.

The operating loop remains:

`Demand → Product → Package → Publish → Distribute → Sell → Deliver → Measure → Learn → Improve`

Documentation, UI polish, traffic, clicks, or a successful payment popup are not equivalent to a completed commercial transaction.

## Evidence levels

| Level | Meaning |
| --- | --- |
| Hypothesis | An assumption requiring validation |
| Demand signal | A real request, search, inquiry, click, or other observable signal |
| Offer validation | A real person has seen and understood a specific offer |
| Checkout intent | A customer starts a TOLVEY checkout |
| Payment confirmation | A provider-confirmed successful payment |
| Fulfillment proof | The purchased outcome is actually delivered |
| Repeat/retention signal | Customer returns, repurchases, renews, or refers |
| Repeatable channel | A channel repeatedly produces qualified demand and transactions |

The strongest commercial claim requires evidence across payment and fulfillment, not only frontend interaction.

## Initial metrics

### Product

- active products
- active offers
- offer conversion readiness
- product version currently attached to each offer

### Checkout

- checkout sessions started
- checkout sessions expired
- checkout sessions cancelled
- checkout-to-order conversion

### Payment

- payment initiation count
- pending count
- confirmed count
- failed count
- expired count
- duplicate callback count
- provider reference coverage

### Fulfillment

- fulfillment pending
- fulfillment completed
- fulfillment failed
- time from payment confirmation to fulfillment completion

### Commercial

- gross transaction value
- paid orders
- average order value
- refund value/count when refunds exist
- repeat customer signals when customer identity exists

No metric should be presented as meaningful business success until the underlying event/state is actually implemented and verified.

## Commercial architecture alignment

Layer 0 provides free/discovery entry points. Layer 1 contains the repeatable digital-product catalog. Distribution is a cross-cutting channel layer. Layer 2 contains implementation/custom services.

Commercial evidence should be attributable to product, offer, version, channel and transaction without making any channel-specific system the source of truth.

## Phase boundaries

Phase 2 establishes transaction truth and operational events.

Phase 3 adds Duitku provider execution.

Phase 4 connects product-to-commerce presentation and direct purchase experience.

Phase 5 adds distribution channels across the canonical product model. Channel listings remain derived representations; they must not fork product truth.

Later phases may add richer analytics only when real transaction volume justifies it.

## Measurement principles

1. Every important transaction state must be attributable to an order/checkout.
2. Events must be idempotent or safely deduplicated.
3. Monetary values must use the canonical money representation.
4. Provider-specific status must not leak into the core domain model.
5. Browser return/success pages are not payment confirmation.
6. Analytics must not become the source of financial truth.
7. D1 operational records remain authoritative for the current system.
8. Derived reports can be rebuilt from canonical records where practical.

## Demand validation

Money Kit remains a hypothesis.

Before declaring a product validated, collect real evidence such as:
- explicit customer requests;
- repeated problem statements;
- willingness to pay;
- checkout attempts;
- completed payments;
- successful fulfillment;
- repeat behavior.

Do not manufacture demand through internal fixtures or demo transactions.

## Reporting language

Use precise language:
- “Implemented” = code exists in the repository.
- “Verified” = behavior was tested/observed with evidence.
- “Planned” = intentionally specified but not implemented.
- “Hypothesis” = commercially unvalidated assumption.
- “Blocked” = cannot proceed because a concrete dependency is missing.

Never convert implementation status into revenue or product-market-fit claims.

## Current state

As of Phase 1 completion:
- transaction metrics are specified but not implemented;
- there are zero production catalog records;
- there are no production transactions;
- no customer demand for Money Kit has been verified;
- Phase 2 is the next implementation gate.
