# TOLVEY — Deployment, Environments & Domains

## 1. Deployment identity
The TOLVEY production application should have stable, recognizable deployment identity.

Target Cloudflare Pages project hostname:

tolvey.pages.dev

This is a target identity, not a claim that the hostname is currently available or already assigned.

If the exact Pages project name is unavailable, stop and report the constraint rather than silently generating another random production identity.

## 2. Business domain
Primary intended business domain:

tolvey.biz.id

Custom DNS/domain attachment must be performed deliberately and verified after configuration.

## 3. Current foundation state
Phase 1 deployed a BYOK Pages project with the assigned hostname:
webapp-3-38j.pages.dev

This hostname is temporary from a branding/identity perspective.

Do not create additional unrelated Pages projects merely to obtain another hostname.

## 4. Environment model
### Local
Local Wrangler runtime and local D1.

### Test
Isolated ephemeral database/runtime.

### Preview/Staging
Currently no remote D1 binding because account quota is unavailable. Preview must fail closed rather than share production.

### Production
Dedicated Pages/Workers project + dedicated production D1.

## 5. Deployment rules
- Build before deployment.
- Run tests before deployment.
- Verify deployment URL.
- Verify health/readiness.
- Verify expected routes.
- Never apply test fixtures to production.
- Never put credentials in repository.
- Never silently change production DNS.

## 6. Pages project policy
One canonical TOLVEY production Pages project.

Preview deployments may have generated URLs; that is acceptable because they are not the canonical production identity.

Production identity should remain stable.

## 7. Domain routing
Desired final relationship:

tolvey.biz.id
→ canonical TOLVEY production deployment

tolvey.pages.dev
→ stable Cloudflare fallback/canonical Pages hostname

Generated preview URLs
→ non-production verification only

## 8. DNS safety
Before changing DNS:
- verify current records
- verify ownership
- identify conflicting services
- make the smallest change
- verify HTTPS
- verify application response
- preserve rollback information

## Phase 2 checkpoint deployment audit — 2026-09-30

Read-only BYOK account inspection verified:
- Existing project: `webapp-3`, assigned `webapp-3-38j.pages.dev`, production branch main.
- Latest production source: `efd5d7d8408646f04e0a72afd52849ba6b550a07` (Phase 1).
- Production binding names: DB; APP_ENV variable. Preview has no D1 binding.
- GET for project `tolvey` in this account returns 404. This only proves account absence, **not global `tolvey.pages.dev` availability** or successful canonical allocation.

The Phase 2 execution checkpoint is partial and non-production only. No remote migration/deploy/project creation/binding/secret/DNS mutation occurred. Existing production is deliberately preserved; no unrelated/random project is created and no canonical identity is falsely claimed.

Pending release work: deliberately verify allocation/migration of the target identity before production deployment. If exact `tolvey.pages.dev` is unavailable, report the actual allocation error and stop that identity change, preserving the existing project. Do not suffix-generate a substitute production identity. `tolvey.biz.id` attachment remains unperformed/unverified. Staging quota remains a known operational concern from Phase 1, not a reason to share production D1.

## 9. Production gate
A deployment is not a commerce launch.

Commerce production requires separate payment, fulfillment, security, recovery, and real-transaction evidence.
