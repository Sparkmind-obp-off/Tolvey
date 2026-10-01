# TOLVEY — Security & Data

## Current boundary and mandatory launch controls — 2026-10-01

Production connection release `d73a4df`: matching production config, encrypted provider/operator secrets and private non-creating connection API. Production commerce/callback/checkpoint remain disabled. Provider authentication is not customer authorization or completed payment; no full security/recovery audit claimed.

Before exposing checkout/publication/delivery:
- Guest/operator principal verification, record ownership, CSRF/origin defenses for cookie mutations, session expiry/revocation and verified recovery; no UUID/email-only access.
- Principal-scoped idempotency; current single-service checkout key/token must not be copied into a public customer design.
- Bounded body/query/contact data, parameterized SQL and output escaping; no raw provider/PII/secrets in logs.
- Deployment-compatible abuse/rate controls and optional server-validated Turnstile; fail closed for new financial initiation if protection unavailable. Callback provider authentication is not a human challenge.
- Minimal email/policy data with documented purpose/retention/access; marketing consent separate, no payment-card storage.
- Private immutable versioned assets and payment-gated entitlements; test unpaid/other-customer/revoked access. Customer session or verified recovery needed, not public storage URLs.
- Durable exception visibility for ambiguous/missing/late payment and paid delivery failure; authorized audited commands, not arbitrary mark-paid/complete-refund endpoints.
- Key rotation, isolated staging/sandbox, safe app rollback and rehearsed data recovery/reconciliation before production launch. D1 restore cannot undo provider payments.

These are target launch requirements, not implemented controls inferred from existing 237 tests. Later Phase 6 adds deeper ergonomics, not permission to defer them. See docs/19 and docs/12.

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

## Phase 2 continuation security

Internal lifecycle is reachable only by imported local/test simulation functions, never HTTP routes or browser success/status. Production/staging configuration fails closed and the production application excludes the simulation module. A VerifiedPaymentSignal type is not authentication; provider/merchant verification requires a later reviewed adapter gateway.

Money is copied from immutable order data and matched exactly on signals. Revision CAS + ownership-gated batch + immutable receipt/fingerprint/key aliases protect replay/conflict. Terminal states/identity/confirmation history are guarded; refund exposes pending/requested only. No actual external side effect or credentials are involved. Existing private non-production checkout API remains flag/token protected and production-forbidden; no new secrets or supplied payment credentials were used.

150 tests cover these boundaries. Pattern hygiene is not a full security audit. Provider credentials shared outside approved storage must be rotated before provider work; do not resubmit replacements through chat.

## Incident response

For a suspected credential leak: disable/rotate credential; inspect affected scope; invalidate sessions/tokens where possible; inspect logs; document incident; restore minimum required access; record remediation.

Never paste secret values into GitHub issues, documentation, chat, or commits.

## Historical Phase 3 local POP security boundary — 2026-10-01

The sandbox-only/no-file-use statements describe the initial code checkpoint, superseded for production connection and secure file consumption by docs/14 and the current boundary below.

At that initial checkpoint only sandbox/local/test was accepted, and supplied credentials were not used. Subsequently secure uploaded-file consumption and matching production connection configuration were explicitly authorized and implemented. Credential provenance from an upload is not a reason to refuse secure execution. Chat-exposed values still require rotation before paid activation. Secrets remain runtime-only; API Key equals Merchant Key.

Minimum callback route validates HMAC-SHA256 over documented merchant/amount/order fields. resultCode/reference are NOT signed, so first acceptance requires a matching authenticated server-side status read before normalized core processing. Merchant/reference/order/money and terminal/expiry rules still apply. Unknown status/outage is fail-closed; exact accepted fingerprint replays can skip status read without repeating a payment. Conflicts are rejected/audited.

Bounded form/body/encoding, rejected duplicate fields, TLS/redirect restrictions, trusted payment URL, generic error/log/request context, no raw signatures/provider bodies/customer/card data. Public browser return never confirms payment. Privileged initiation remains a function, no public HTTP route. Provider data audit is supplemental, not a financial ledger or business metrics.

Required email is transmitted to the sandbox provider, not logged/persisted in plaintext; production/customer retention and public access/rate limits require later review. Local stubs/ephemeral test material are not credentials usable on the live provider. No complete security audit or production recovery claim. See docs/14 for live compatibility/rotation prerequisites.
