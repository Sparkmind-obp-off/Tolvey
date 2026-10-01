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

The three business engines are Own Commerce, Distribution and Brand/Demand. Offering tiers are separately Layer 0 free/discovery, Layer 1 repeatable digital products and Layer 2 implementation/custom services. Ads/personal-brand content are acquisition activity, not necessarily a checkout platform.

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

## Current state — 2026-10-01

Foundation deployed, Phase 2 complete local/test, production provider connection verified with payment execution disabled. Operational events/receipts exist in local transaction code, but commercial reporting/customer attribution/use evidence is not implemented. Audit curl public catalog lists were empty; this is not a fresh privileged DB/financial inventory. No production payment, independent customer demand or Money Kit validation is evidenced. Next build priority is one candidate/publication/customer page plus separately tracked Phase 3 live blocker, not restarting Phase 2.

## Minimal measurable funnel (target contract, not implemented pipeline)

| Fact / metric | Source and denominator | Interpretation |
| --- | --- | --- |
| Qualified offer visit/inquiry | Defined offer page/real inquiry within experiment window; bots/test traffic excluded where identifiable | Demand signal, not willingness-to-pay proof; disclose unavailable dedup |
| Checkout intent rate | Distinct eligible customer checkouts / qualified offer visits in same cohort | If visits unavailable, report count only, not invented conversion |
| Payment completion | Distinct confirmed owned/channel orders / distinct eligible checkouts for that destination | Callback retries/status views never extra sales; unknown external checkout denominator stays unavailable |
| Fulfillment completion | Distinct completed/access-ready paid orders / confirmed paid orders due for delivery | Separate grant-ready, retrieved bytes and customer-reported use; service completion uses acceptance evidence |
| Delivery time | confirmation-to-availability and availability-to-retrieval measured separately | Do not claim instant delivered/customer use from a DB state alone |
| Refund/dispute/support | Verified completed refunds/disputes and support cases / applicable paid cohort | Request ≠ refund; pending cases/count and support minutes visible |
| Repeat/use evidence | Real identity-linked repeat or permissioned feedback where identity is verified | Do not join customers across channels from unverified email/name assumptions |

Every monetary report includes currency/exponent and test/local/sandbox/controlled-verification exclusions. A controlled production test may prove payment mechanics, not independent demand. Never add currencies without conversion method/source/time. Attribution unknown/direct/unavailable remains explicit; client source labels are not authenticated acquisition evidence.

## Minimum economics before paid acquisition

Record actual gross confirmed paid amount; verified refund amount; provider/channel fees; payment settlement/payout status; recorded variable asset/service/support cost and ad spend. When supported by records:

`Recorded contribution = gross paid − completed refunds − actual fees − recorded variable delivery/support cost − attributed acquisition spend`.

This is not accounting profit/revenue recognition. Unknown fees/costs are disclosed, never silently zero. Chargebacks/withheld settlement and tax obligations are reviewed separately. Compare same product/version/offer, destination, window and price/promotion; no channel ranking solely from raw sales.

Before any ads: owner-approved budget/spend cap, eligible claim/creative/channel, working conversion/delivery/support, recording costs and an explicit stop rule. Organic content and genuine product demonstrations may start earlier without making sales claims.

## Weekly experiment/decision record

One persona/job/offer/destination; dated hypothesis and real evidence source; owner; experiment start/end; expected learning; organic or approved spend cap; observed funnel/fees/failures/feedback; missing data; decision continue/improve/pause. Set evaluation criteria before the experiment; first sale is not repeatability/product-market fit. Do not invent statistically significant conversion or prescribe a universal validation threshold without traffic/economics context.

Manual review/structured evidence is sufficient initially. D1 canonical transaction truth remains authoritative for implemented own-shop operations; external manual pilot register is provisional/not normalized until Phase 5 intake exists (docs/19/38). UI dashboards or automation are not required to learn, but reports must declare their source and completeness.
