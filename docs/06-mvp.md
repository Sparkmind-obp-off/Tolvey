# TOLVEY — Minimal Commercial Loop (MVP)

Updated: 2026-10-01. Target scope, not a claim of implementation.

## Goal and three engines

One real customer can understand, buy and receive one useful TOLVEY-owned product; the operator can see/recover the transaction. Own Commerce is the canonical shop, Distribution offers eligible external doors, Brand/Demand brings qualified traffic. Product tiers are not these engines.

Money Kit is a candidate, **not compulsory or validated**. Select one launch candidate based on actual buyer/job, asset readiness and manageable delivery/support. The catalog in docs/30 is an idea inventory, not a requirement to build every family.

## Must have for first direct-commerce launch

1. Real working product package: buyer/job, contents, version, license, compatibility, instructions and operator QA.
2. Canonical Product/ProductVersion/Offer with authoritative IDR whole-rupiah price and explicit delivery/support/refund terms.
3. Controlled draft/review/publication/unpublish path; active parents and real private asset presence validated, publication audited.
4. Mobile-friendly storefront/product detail, honest available/unavailable CTA, help/privacy/terms. No fake reviews, sales or urgency.
5. Guest-first scoped customer access and verified recovery/support; ownership, CSRF/origin, expiry/revocation and abuse protection. Internal operator token never enters customer browser.
6. Atomic checkout/pending order, principal-scoped idempotency, server amount, bounded contact/policy data. Initial one offer/order, quantity 1; no cart.
7. Supported Duitku initiation, verified callback + server status and real environment evidence. Browser redirect never marks paid.
8. Payment-gated private version-pinned delivery/entitlement; retry/failure visibility and actual recipient access evidence. Customer use is a separate feedback fact.
9. Small operator order/exception read view and safe actions: uncertain initiation, late/missing payment, delivery failure, recovery, refund request/support. Refund completion needs external evidence.
10. Baseline monitoring, rate limits, key hygiene, isolated environment, additive migration/recovery/rollback review **before** opening checkout.
11. Minimal source/destination labels, distinct confirmed/fulfilled facts and real feedback; tests excluded from demand/economics claims.

Current state is not this MVP: foundation/local transaction core and production provider connection exist; customer commerce/delivery and production execution do not.

## Smallest cross-engine business execution

- Own Shop: one digital offer first; services have one scoped inquiry CTA until service-order/acceptance workflow exists.
- Distribution: one eligible manual external storefront if policy/account/fulfillment pass. Do not wait for all adapters; external proof is not own-shop payment proof.
- Brand/Demand: one primary channel, genuine product demo/use-case, one measured destination and weekly review. Optional personal-brand presence states its relationship to TOLVEY.
- Free lead magnet is optional, not a prerequisite to a paid product. A free grant never creates a fake paid event.
- Ads require owner-approved budget, allowed claims, working delivery and recorded unit economics; no promise of quick revenue.

## Preparation, release and validation are separate

- Preparation gate: real brief/package and publication-to-page proof. Can be built read-only/non-production while provider gate is blocked under separate authorization.
- Integrated Phase 4 gate: full non-production customer loop + failure/recovery/ownership tests, including Phase 3 live provider evidence where applicable.
- Phase 7 release gate: explicit production authorization, reviewed gateway/schema/secrets, controlled real payment/delivery/reconciliation and safe rollback. A deployment is not a launch.
- Commercial validation: real independent customer/use/repeat evidence and economics; an operator-controlled verification transaction does not validate demand.

## Defer

Large operator suite, every family/channel, coupons, multi-item cart, subscriptions, affiliate engine, automated publishing/content, advanced segmentation/BI, extra providers and adaptive automation.

## Out of scope

Multi-vendor seller accounts/wallets/escrow/commissions, recommendation engine, accounting replacement, custom payment processor and premature microservices.

Full cycle/dependencies: docs/19. Prioritized build/session gates: docs/15. Execution prompt: docs/16.
