# TOLVEY — Security & Data

## Security principles

- Least privilege
- Secrets never committed
- Production credentials separated from development
- Customer data minimized
- Payment data delegated to compliant payment providers
- External channel credentials isolated
- Audit important operator actions
- Back up critical product and order data
- Validate all external inputs

## Data classes

Public: brand, product descriptions, public content, public pricing.

Internal: product strategy, channel configuration, operational notes, analytics.

Confidential: customer records, order details, business metrics not intended for publication.

Secret: API keys, access tokens, webhook secrets, payment credentials.

Secrets must only exist in approved secret storage/environment configuration.

## Customer data

Collect only data required for fulfillment, support, transaction records, consented communications, or legally/operationally required records.

## External channels

Treat every marketplace/social/payment integration as an untrusted boundary. Verify webhook signatures where supported, validate payloads, rate-limit endpoints, avoid logging tokens, store external IDs safely, and handle duplicate events idempotently.

## Phase 2 checkpoint security boundary — 2026-09-30

The transaction checkpoint is non-production-only and disabled by default. Enabling it requires explicit APP_ENV, D1, `TRANSACTION_CORE_ENABLED=true`, and a private random `TRANSACTION_CORE_TOKEN` (32–256 characters) in ignored local configuration/approved server-side secret storage. A hashed fixed-length comparison validates bearer credentials; credentials never appear in browser code, API DTOs, normal logs or commits.

This is one trusted internal service principal authorizing checkpoint creation/reads, not customer login, multi-tenant/record ownership auth, or Hosted route admission. Production is rejected even with flag/token; no public admin or arbitrary payment-confirmation mutation exists. Public transaction access/rate-limiting policy remains mandatory before exposure in a later release.

Inputs are bounded/validated: 2048-byte streamed JSON, UUIDs, integer quantity 1–100, source label, optional opaque customer UUID, idempotency key. Unknown fields including client money/status are rejected. Money is selected/calculated from active canonical rows at write time. Customer email/contact, raw provider payload and consent collection are not implemented.

Snapshots/version-content and append-only audit are enforced in D1. Events contain safe identifiers/state/duplicate context, not sensitive payloads. These are baseline controls, not a complete security/recovery audit or verified provider/callback implementation.

## Incident response

For a suspected credential leak: disable/rotate credential; inspect affected scope; invalidate sessions/tokens where possible; inspect logs; document incident; restore minimum required access; record remediation.

Never paste secret values into GitHub issues, documentation, chat, or commits.
