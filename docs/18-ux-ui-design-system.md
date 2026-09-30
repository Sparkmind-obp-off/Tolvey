# TOLVEY — UX/UI & Design System

## 1. Experience goal
TOLVEY should feel like a serious, calm, useful product house rather than a generic marketplace or technical dashboard.

The interface should make the value proposition and next action obvious.

## 2. Experience principles
- Clarity over decoration.
- Product outcome before feature inventory.
- One primary action per screen.
- Trust before conversion pressure.
- Consistent hierarchy across product, checkout, and status surfaces.
- Mobile-first for customer commerce.
- Accessible, fast, and resilient on low-bandwidth connections.

## 3. Information architecture
### Public
- Home
- Product/offer detail
- Checkout entry
- Transaction status
- Help/support
- Legal/privacy surfaces when required

### Operator
- Overview
- Products
- Versions
- Offers
- Orders
- Payments
- Fulfillment
- Channels
- Events/audit
- Settings

Operator surfaces remain controlled and are not part of the current public Phase 1 API.

## 4. Core customer journey
Discovery → Product understanding → Offer selection → Checkout → Payment → Processing → Fulfillment → Outcome → Feedback.

## 5. Product page structure
1. Product identity
2. Problem/context
3. Promise/outcome
4. What's included
5. Version/format information when relevant
6. Price and offer terms
7. Primary CTA
8. Trust/support information
9. FAQ where useful

## 6. Checkout UX
- Show product, offer, quantity, currency, and authoritative total.
- Avoid editable client-side totals that can conflict with server truth.
- Clearly distinguish processing from confirmed payment.
- Never show paid solely because a browser returned from a provider.
- Provide safe retry/status paths.

## 7. Transaction status
Use human-readable states mapped from the canonical transaction state:
- Processing payment
- Payment confirmed
- Preparing delivery
- Delivered
- Payment failed/expired
- Cancelled
- Delivery issue

Technical provider states must not leak unnecessarily into customer copy.

## 8. Visual system
Define tokens before component proliferation:
- typography scale
- spacing scale
- border radius
- elevation
- neutral/semantic colors
- interaction states
- responsive breakpoints
- icon rules

No final visual palette is locked by this document. The design system should be implemented as reusable tokens so branding can evolve without rewriting components.

## 9. Accessibility
Target WCAG-aligned practices:
- keyboard access
- visible focus
- semantic HTML
- sufficient contrast
- form labels/errors
- reduced-motion support
- meaningful status announcements

## 10. Design deliverables before major storefront work
- sitemap
- customer journey map
- low-fidelity wireframes
- component inventory
- design tokens
- responsive states
- checkout/error/status states
- accessibility checklist

Do not build a large UI solely to make a presentation look complete.
