# TOLVEY — Frontend Architecture

## 1. Purpose
Define the customer-facing web architecture without prematurely committing to a heavy frontend framework.

## 2. Frontend responsibilities
- present canonical product/offer data
- communicate value and terms
- initiate approved checkout flow
- show transaction status
- provide support/feedback paths
- maintain responsive and accessible experience

The frontend is never authoritative for price, payment confirmation, fulfillment authorization, or secrets.

## 3. Rendering strategy
Prefer server-compatible, Cloudflare-friendly rendering and small client-side enhancements.

Use client JavaScript only where it improves interaction.

Avoid shipping a large application bundle for simple product/checkout surfaces.

## 4. Data access
Frontend reads canonical public API DTOs.

Sensitive fields such as private delivery references, internal metadata, provider secrets, and internal audit data are never exposed through public DTOs.

## 5. State
Customer UI state may include:
- loading
- ready
- processing
- success/confirmed
- failed
- expired
- unavailable

Server state always wins for transaction truth.

## 6. Components
Build reusable components around:
- navigation
- product card
- product detail
- offer selector
- price display
- CTA
- checkout summary
- payment/status panel
- error/empty state
- feedback/support

## 7. Performance
- small JS payload
- optimized assets
- semantic HTML
- caching only where safe
- no client-side polling without a clear need
- avoid blocking third-party scripts

## 8. Frontend security
- no secrets
- no trust in client totals
- escape/render untrusted content safely
- safe redirect handling
- CSP/security headers
- provider browser integration only according to current provider documentation

## 9. Current state
Phase 1 has a minimal foundation/status surface, not the final storefront.

Full product/storefront UX belongs to later product-to-commerce work after the transaction foundation is stable.
