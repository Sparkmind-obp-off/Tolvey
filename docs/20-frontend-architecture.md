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

## 9. Current state and next slice — 2026-10-01

The deployed public UI is still a foundation/status surface, not a storefront. Local transaction core and production provider connection exist, but customer checkout/status/access UI is absent. Independent approved publication-to-product-page preparation can proceed without payment activation. See docs/15 and docs/19.

Use existing Hono SSR/semantic HTML/CSS and small client JS. Planned customer surfaces consume public catalog or ownership-protected order DTOs, never operator/internal bearer credentials. Guest session/CSRF/origin and verified recovery are explicit backend dependencies. Payment return reads normalized owned status through a safe path; query result never confirms anything. Pending polling, if needed, is bounded/backoff/stops on terminal state; provider traffic cannot be triggered freely by customer polling.

Current CSP has `form-action 'none'`, no scripts and default deny. A future form/enhancement/Turnstile flow needs minimal reviewed CSP changes with compiled/browser tests; do not weaken all origins merely to load a popup. Hosted provider redirect is the initial POP UI option. Pages status/name and unavailable CTA must not imply launched commerce. Missing session offers verified recovery/support, not anonymous UUID lookup. Operator UI needs its own server-authenticated session, not a diagnostic secret embedded in JavaScript.
