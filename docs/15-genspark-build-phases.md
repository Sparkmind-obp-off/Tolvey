# 15 — Genspark Build Phases & Session Strategy

## Objective
Build TOLVEY as a production-oriented Product House Hub + Commerce House Hub, using Genspark as an implementation environment while preserving a Cloudflare-compatible production architecture.

The build is divided into gated phases. One phase should normally be one focused Genspark session. Do not burn a large session trying to build the entire system blindly.

## Operating rule
One session = one bounded objective = one verifiable artifact/state change.

A session must end with:
- implementation completed or explicitly blocked
- tests run
- evidence captured
- files/commits identified
- next gate defined

## Phase 0 — Repository & Architecture Audit
Goal:
- read all existing TOLVEY docs
- inspect repository
- inspect current implementation
- identify gaps
- confirm Product House + Commerce House architecture
- confirm no marketplace V1 drift

Output:
- implementation plan
- risk list
- exact build order

Gate:
- architecture accepted and no contradictory assumptions remain

## Phase 1 — Foundation
Build:
- application shell
- environment configuration
- product/offer model
- canonical catalog
- basic storefront
- operator/admin foundation
- Cloudflare-compatible project structure

Gate:
- product can be created/read/published in canonical form

## Phase 2 — Transaction Core
Build:
- CheckoutSession
- Order
- Payment
- Fulfillment
- transaction state machine
- idempotency
- event/audit model
- transaction APIs

Gate:
- a test order can move safely through checkout/payment/fulfillment states without a provider

## Phase 3 — Duitku POP
Build:
- Duitku provider adapter
- sandbox configuration
- checkout initialization
- popup/redirect integration as supported
- callback verification
- payment-status normalization
- failure/retry handling
- safe return page
- transaction logging

Gate:
- verified sandbox payment completes end-to-end
- duplicate/invalid/mismatched callbacks are handled safely

## Phase 4 — Product-to-Commerce Loop
Build:
- real product offer
- product page
- checkout
- Duitku POP
- order record
- fulfillment/delivery
- customer outcome
- transaction analytics

Gate:
- a real customer can discover → checkout → pay → receive/use the product

## Phase 5 — Distribution
Build only the minimum needed:
- channel registry
- canonical product export
- channel listing model
- source attribution
- external-channel order normalization where feasible
- links/deep links to external commerce channels

Possible channels:
- TOLVEY direct storefront
- Link.id-style link commerce
- marketplaces
- social commerce
- affiliate/creator distribution

Gate:
- the same canonical product can be distributed to more than one channel without duplicating the source of truth

## Phase 6 — Observability & Security Hardening
Build:
- structured events
- correlation IDs
- transaction dashboard
- error monitoring
- secret handling
- access controls
- webhook/callback protection
- audit logs
- backup/recovery considerations

Gate:
- operator can determine what happened to a transaction without inspecting raw production infrastructure manually

## Phase 7 — Production Validation
Run:
- unit tests
- integration tests
- E2E checkout tests
- Duitku sandbox regression
- security checks
- failure-path tests
- production configuration review
- rollback rehearsal

Then:
- controlled production transaction
- verify real payment
- verify fulfillment
- verify analytics
- record evidence

Gate:
- production launch decision based on evidence, not visual completion

## Phase 8 — Optimization
Only after real transactions:
- automate repetitive work
- improve conversion
- add more payment providers
- add more channel adapters
- improve product catalog tooling
- add subscriptions/bundles/affiliate features if justified
- optimize costs

## Explicit non-goals for V1
Do not build:
- multi-vendor marketplace
- seller onboarding
- seller wallets
- escrow
- seller commission engine
- complex recommendation engine
- full ERP/accounting system
- unnecessary microservices
- every marketplace integration at once

## Session budget discipline
Prefer small sessions with a clear output.

Recommended order:
1. audit
2. foundation
3. transaction core
4. Duitku POP
5. real product checkout
6. distribution
7. security/observability
8. production validation

If a phase exposes a blocking architecture problem, stop and fix the smallest root cause before proceeding.

## Definition of done
TOLVEY V1 is not done because the website looks finished.

V1 is done when:
- a canonical product exists
- an offer can be published
- a customer can reach checkout
- direct payment can be processed through Duitku POP
- payment confirmation is verified server-side
- order state is persisted
- fulfillment completes
- transaction evidence is observable
- at least one real transaction has been successfully completed
- the system remains compatible with additional channels/providers
