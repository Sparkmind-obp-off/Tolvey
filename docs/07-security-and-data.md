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

## Incident response

For a suspected credential leak: disable/rotate credential; inspect affected scope; invalidate sessions/tokens where possible; inspect logs; document incident; restore minimum required access; record remediation.

Never paste secret values into GitHub issues, documentation, chat, or commits.
