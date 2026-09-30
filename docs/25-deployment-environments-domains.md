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

## 9. Production gate
A deployment is not a commerce launch.

Commerce production requires separate payment, fulfillment, security, recovery, and real-transaction evidence.
