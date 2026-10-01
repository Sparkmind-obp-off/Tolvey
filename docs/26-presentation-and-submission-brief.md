# TOLVEY — Presentation & Submission Brief

## 1. Purpose
This document defines the canonical story for presenting TOLVEY to a reviewer, partner, customer, collaborator, or future investor.

It should explain the system without pretending planned features are already live.

## 2. One-line description
TOLVEY is a Product House Hub + Commerce House Hub that turns validated demand into owned products, offers, transactions, fulfillment, and measurable learning across multiple channels.

## 3. The problem
Product creation and commerce are fragmented across tools and channels. The operator needs one canonical product/commercial truth while customers need a simple, trustworthy buying experience.

## 4. The solution
TOLVEY separates:
- Product ownership
- Commerce execution
- Distribution
- External integrations
- Transaction truth
- Operational learning

## 5. Architecture story
Experience → API/Application → Domain → D1/Data → Integration Adapters → External Providers/Channels.

Cross-cutting:
Security + Observability + Versioning + Operations.

## 6. Product story
Demand signal → Product → Product Version → Offer → Channel → Checkout → Order → Payment → Fulfillment → Customer Outcome → Learning.

## 7. Technology story
Current foundation:
- Hono
- TypeScript
- Cloudflare Pages/Workers-compatible runtime
- Cloudflare D1
- automated tests
- Git-based release discipline

Planned:
- live sandbox verification (POP adapter/callback gateway code is locally verified)
- production provider activation/release
- fulfillment/delivery
- distribution adapters
- operational observability hardening

## 8. Current evidence
Phase 1 Foundation Gate:
- executable application
- real D1 schema
- Product/ProductVersion/Offer
- read APIs
- 69 automated tests
- build/typecheck/format verification
- local and remote migration verification
- deployed foundation

This is technical foundation evidence, not evidence of commercial success.

Phase 2 continuation (2026-09-30): **COMPLETE within provider-neutral local/test scope**, with Git delivery evidenced by final report/history.
- Implemented + Verified: checkout/payment/fulfillment orchestration, exact references/money, expiry/cancellation, failure/retry, safe refund-request representation, atomic revision CAS/operation audit/dedup.
- Verified: 150 tests, full lifecycle in compiled workerd simulation, concurrency, eight rollback/retry failure paths, fresh/upgrade migrations preserving checkpoint data, typecheck/format/build, FK/integrity and local runtime deny-by-default.
- Not implemented: real provider authentication/callbacks, actual payment/delivery/refund, public customer checkout or production commerce release.
- Production remains Phase 1 at webapp-3-38j.pages.dev; no remote migration/deploy/DNS changes. Target hostname/domain not achieved or proven available.
- No real customer outcome, revenue, demand or Money Kit market evidence.

Phase 3 code verification (2026-10-01): CODE COMPLETE / SANDBOX BLOCKED.
- Implemented + locally Verified: isolated POP/HMAC adapter, canonical initiation, minimum authenticated callback/status verification, replay/conflict controls and provider-only audit/metadata.
- Verified: 220 tests including 70 POP contract tests, compiled workerd/Hono callback success/failure/duplicate/invalid using strict provider stubs, typecheck/format/build, fresh/upgrade/FK/integrity.
- Blocked: rotated approved sandbox credentials and live POP invoice/payment/callback/status interoperability. LOCAL CONTRACT TEST ONLY, not sandbox transaction evidence.
- No production deploy/activation, real delivery/refund, revenue/demand or Phase 4 work. Phase 2 completion/history remains intact.

## 9. What is intentionally not claimed
- no real customer transaction yet
- no verified production payment
- no Duitku production integration
- no fulfillment proof
- no marketplace
- no seller infrastructure
- no demand proof for Money Kit

## 10. Phase roadmap
0 Audit
1 Foundation
2 Transaction Core
3 Duitku POP
4 Product-to-Commerce Loop
5 Distribution
6 Observability & Security Hardening
7 Production Validation
8 Optimization

Each phase is one complete engineering/business gate. Credit limits may require multiple working sessions, but there are no externally named Phase A/B/C subdivisions.

## 11. Presentation structure
Recommended deck:
1. TOLVEY
2. Problem
3. Product House + Commerce House model
4. Core operating loop
5. Product architecture
6. Commerce/transaction architecture
7. Full-stack architecture
8. UX/customer journey
9. Data/D1 architecture
10. Integration architecture
11. Security/reliability
12. Verified Phase 1 and provider-neutral local/test Phase 2 evidence (not production commerce)
13. Roadmap
14. Business validation gate
15. Closing: real transaction evidence as the final proof

## 12. Presentation rule
Every slide must label claims as one of:
- Implemented
- Verified
- Planned
- Hypothesis
- Blocked

Never use visual polish to imply technical or commercial evidence that does not exist.
