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
- provider-neutral transaction core
- Duitku POP adapter
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

Phase 2 execution checkpoint (2026-09-30), **in progress**:
- Implemented + locally Verified: durable schema, atomic checkout/pending order, immutable snapshots, idempotency/audit, and a feature-flagged protected internal non-production API.
- Verified: 109 automated tests (69 Phase 1 regressions + 40 checkpoint tests), typecheck/format/build, local upgrade/fresh migrations, 12-request concurrency, rollback/retry, and local create/replay/protected status reads.
- Planned/not verified: complete payment-to-fulfillment lifecycle, provider signal ingestion, expiry/cancellation, refund/fulfillment operations, and production release of transaction APIs.
- Deployment unchanged: production remains Phase 1 at webapp-3-38j.pages.dev; no remote migration or DNS change. Target tolvey.pages.dev is not achieved or proven available.
- No real payment, delivered customer outcome, revenue, or Money Kit market evidence exists from this checkpoint.

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
12. Verified Phase 1 evidence and explicitly partial Phase 2 checkpoint
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
