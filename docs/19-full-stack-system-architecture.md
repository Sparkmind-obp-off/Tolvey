# TOLVEY — Master Full-System Workflow & Full-Stack Architecture

Status: canonical target workflow; **specification, not newly implemented capability**.
Updated: 2026-10-01. Audit baseline: `d73a4dfba04c8207f2b5f440e0052840cefdfc3d`.

## 1. Authority and outcome

Strategy: [39](39-vision-mission-north-star.md). Commercial model: [34](34-commercial-architecture-master.md). Audit/backlog/engineering gates: [15](15-genspark-build-phases.md). Execution prompt: [16](16-master-system-prompt-genspark.md).

TOLVEY is a Product House Hub + Commerce House Hub, initially Indonesia, not a multi-vendor marketplace. **ONE PRODUCT, MANY DOORS**:

`One canonical product source → many distribution channels → one normalized transaction model → one operational truth.`

The first useful full-stack result is not a dashboard full of empty modules. It is **one real versioned product/offer, understandable customer pages, safe purchase and private delivery, and an operator able to resolve exceptions**. Revenue and validated customer outcomes require subsequent real evidence.

### Three engines, not three product tiers

| Business engine | Responsibility | Initial smallest execution |
| --- | --- | --- |
| Own Commerce — TOLVEY Shop | Canonical catalog, products/services, checkout/order/payment/delivery | One sellable digital product; services initially scoped inquiry, not instant download |
| Distribution | Optional external listings and checkout paths | One eligible external storefront, manual listing and evidence intake first |
| Brand/Demand | Owned/personal brand, social, content, search and qualified traffic | One primary social channel, demonstrations and an attributed offer link |

Layer 0 free/discovery, Layer 1 reusable digital products, and Layer 2 services describe **what is offered**. They are not the three engines or engineering phases. Ads are paid acquisition under Brand/Demand, not automatically external commerce. Personal-brand content must state its relationship to TOLVEY honestly.

## 2. Actual baseline — do not confuse layers of evidence

- Hono/TypeScript/Pages + D1 catalog reads are deployed. Public root is an infrastructure status page, not a shop.
- Provider-neutral checkout/lifecycle/CAS/receipts exist and are tested locally. Internal token is not customer authorization.
- Duitku production configuration/secrets and protected, non-creating backend authentication check are deployed. This is **connection verified, payments disabled**.
- Gateway rejects production; core factories accept local/test only. Migration 0004 stores sandbox-only provider metadata. Remote transaction migration/release is not accomplished.
- 237 tests passed in the prior code release; provider stubs are local contract evidence. No real sandbox invoice/payment/callback full cycle or production paid order is evidenced.
- No customer storefront checkout, identity/recovery, private R2 delivery, operator publication service, service execution, external-order intake or commercial metrics report is implemented.
- Custom domain `tolvey.biz.id` remains unconfigured. Current deployment: https://webapp-3-38j.pages.dev.

## 3. Master business cycle

`Demand → Select one job → Build/QA package → Version → Offer/terms → Publish → Route traffic → Checkout → Verify payment → Fulfill/access → Support/reconcile → Measure → Decide → Improve`

| Step | Input and owner | Durable output / control | Completion evidence |
| --- | --- | --- | --- |
| Demand | Founder: real inquiry, observed problem, interview/content response | Dated evidence, persona, problem, source and uncertainty | Real source recorded; no invented willingness to pay |
| Select | Founder + product operator | One launch brief, scope, proposed price, format and outcome | Deliverable and buyer explicit; Money Kit optional hypothesis |
| Build/QA | Product creator | Working master files, Quick Start, license, compatibility, sample data | Fresh-user walkthrough; arithmetic/file/links checked |
| Version | Operator | Stable Product/ProductVersion, immutable asset manifest/hash | Purchased version can be retrieved after a later update |
| Offer | Operator | Authoritative Offer money, version, delivery/support/refund terms | Positive IDR whole-rupiah amount for initial paid POP path; terms approved |
| Publish | Authorized operator | Draft → reviewed active product/version/offer; publication audit | Public detail matches D1; missing assets prevent paid activation |
| Demand route | Brand/distribution operator | Approved destination, listing/campaign/creative references | Link and CTA work; policy review completed |
| Checkout | Customer via authenticated/scoped guest session | Atomic order + immutable snapshot + ownership + idempotency | Retries do not duplicate; another customer cannot read it |
| Initiate | Server provider gateway | Durable reservation, trusted provider receipt/reference | One outbound invoice; uncertain outcome becomes exception, not blind retry |
| Confirm | Authenticated callback + server-side status | Exact merchant/order/reference/money/state transition and receipt | Real supported environment verification; browser cannot set paid |
| Fulfill | Fulfillment service/operator | Payment-gated entitlement/delivery record for pinned version | Authorized recipient can retrieve; unpaid/other recipient denied |
| Support | Operator + customer | Issue, response, recovery action and separate refund evidence | Safe re-access; escalation and honest current status |
| Reconcile | Operator | Provider/channel evidence matched to internal truth | Pending/late/missing/ambiguous items assigned, not silently discarded |
| Measure | Operator | Deduplicated verified facts, fees/costs, outcome feedback | Funnel and economics use denominators and disclose missing data |
| Decide | Founder | Continue/improve/pause; next experiment and version | Decision cites real evidence; no forced catalog expansion |

This cycle may run manually for content, product QA, listing, support and review. Payment authentication, money integrity, customer authorization and entitlement checks cannot be replaced with guesswork or screenshots.

## 4. Three supported commercial paths

### Own-shop digital purchase

`Content/search → product detail → checkout/session → pending order → durable POP initiation → hosted provider redirect → authenticated callback/status → PAYMENT_CONFIRMED → payment-gated access → fulfillment evidence → feedback`

Redirect is the minimum chosen provider UI, supported by official POP docs [S1]. Popup is optional, not a prerequisite. Initial scope: one offer/order, quantity 1, IDR exponent 0, no cart, coupons, subscriptions or bundles. Core quantity 1–100 remains preserved but need not be exposed.

### External-channel purchase

`Same canonical product/version → approved channel listing → external checkout/payment/delivery → verified channel evidence → normalized external transaction → review`

The channel owns its checkout execution. TOLVEY does **not** create a second Duitku invoice for that sale or inject an unverified channel message into the own-shop payment core. Record `(channel, external_order_id)` uniquely, original amount/currency, channel fees/refund/delivery evidence, canonical product/version mapping and verification source/time. Missing evidence stays UNKNOWN/UNVERIFIED; never infer paid from a click.

The existing own-shop schema requires a CheckoutSession and does not yet support this intake. Phase 5 must add an explicit, additive external-origin model/read projection; do not create fake checkout/payment rows to force compatibility. Before that implementation, a manual pilot may use a restricted structured evidence register with stable IDs, disclosed as **not yet normalized in D1**. No double counting it in application revenue. Later import reconciles the same IDs, not a second independent ledger.

### Service sale

`Service page → qualified inquiry → scope/dependencies/capacity → accepted proposal → agreed payment milestones → human delivery/revisions → acceptance/handoff → support`

Publish defined capabilities and an honest inquiry CTA first. No instant-buy service until scope, capacity, deliverables, price, revisions, timeline, acceptance and refund/cancellation terms are settled. Current DIGITAL/BLOCKED fulfillment placeholder is not service delivery. Future service orders need a reviewed type/scope snapshot and milestone/acceptance records. Custom work never overwrites reusable Layer 1 assets.

## 5. Full-stack implementation choices

| Concern | Minimum direction | Current vs planned |
| --- | --- | --- |
| Runtime/API | Existing modular Hono + TypeScript Pages Worker | Keep implemented stack; no Next.js rewrite |
| Customer UI | Server-rendered semantic HTML/CSS + small JS | Planned product, checkout, status, help/legal surfaces |
| Operational persistence | D1, parameterized SQL, additive migrations, atomic batches/CAS | Implemented catalog/local transaction core; new data only when required |
| Private assets | R2 binding, immutable versioned object keys + manifest/hash in D1 | Planned; no paid assets in public/static or public bucket |
| Payment | Existing isolated Duitku POP adapter | Production auth verified; transaction release still blocked |
| Customer access | Guest-first, high-entropy server-issued session, hashed scoped credential in D1 | Planned; do not use order UUID/email or operator token as authorization |
| Operator | One tightly scoped operator principal; server-side verification and audited commands | Connection bearer exists only for diagnostics, not an admin browser login |
| Abuse controls | Deployment-compatible rate limiting + server-validated Turnstile where justified | Planned; native limiter eventual consistency is not financial correctness [S5/S6] |
| Notifications | On-site status + recovery/support first; transactional email API when recovery requires it | Provider/account/domain selection not yet made; no extra provider by default |
| Reporting | Safe operator read view + small canonical SQL aggregates | Planned; no separate warehouse/BI prerequisite |
| Scheduling | Explicit operator reconcile initially; later durable scheduled work if demonstrated | No cron/queue/automation dependency for first loop |

The guest access proposal requires Secure/HttpOnly/SameSite cookies, per-order ownership, expiry/revocation, origin/CSRF checks for browser mutations and tested recovery. A checkout session permits access to its order, not general customer history. Email knowledge alone is not identity. If cross-device recovery is promised, implement verified email recovery or a documented assisted identity-verification process before launch; do not advertise an unimplemented magic link.

A future operator UI requires a reviewed authentication/session boundary (for example verified Access identity in BYOK, or minimal server-authenticated operator session). Never embed the existing diagnostic bearer in browser JavaScript. Hosted route admission and application record authorization are separate; the current project remains BYOK and this audit changes neither.

## 6. Data changes to design, not assumed existing tables

- Catalog/publication: structured content/terms needed by one product; audited review/activation, active-parent integrity and asset presence. Existing DRAFT/ACTIVE/ARCHIVED is publication lifecycle, not commercial validation.
- Assets: ProductVersion → immutable manifest → R2 objects; checksum, length, MIME, license and delivery type. A private delivery_reference string alone does not prove a real asset exists.
- Checkout ownership/contact: scoped principal/session, minimal email required by POP, retention/purpose, policy acceptance version/time. Scope idempotency to authenticated principal; current `checkout.create:v1` key scope is single-service, not safe multi-customer design.
- Entitlements: unique order/version grant, payment and refund/revocation policy, access expiry where promised, retrieval audit distinct from user outcome.
- Exceptions: durable case/reference, reason, operator, evidence, safe action and resolution. Manual queue/view is sufficient initially.
- Service inquiry and scope: separate workflow; do not overload product metadata to imitate project management.
- External origins/listings: unique channel IDs and verified mapping. No cross-channel customer-identity assumption.
- Attribution: bounded source/campaign/creative labels and observed destination; untrusted/self-reported labels are not payment evidence. No raw URL/query/token/PII in logs.

Existing migrations 0001–0004 are immutable. Production environment support must use a reviewed additive migration/replacement-table strategy and tested backfill/constraints, not change 0004's sandbox CHECK or spoof local/test to bypass guards. Extend the same generic engine through a narrow reviewed production service facade, never enable the simulation factory. Existing safety tests that assert commerce routes absent must be deliberately revised when approved routes are added, preserving denial/secret/ownership regressions rather than blindly deleting tests.

## 7. Exception full cycle — launch prerequisite

| Situation | Required safe behavior |
| --- | --- |
| Abandoned/expired checkout | Do not initiate overdue order; readable expired status; new checkout explicitly distinct |
| Customer double-submit/retry | Stable principal-scoped idempotency, same-meaning replay; changed meaning conflict |
| POP timeout / RESERVED ambiguity | Preserve reservation; assigned reconciliation case; no reset/delete/blind create |
| Provider receipt saved, core attachment fails | Attach persisted READY receipt safely, without a new invoice |
| Duplicate/out-of-order callback | Verify context; one canonical transition; conflict visible, not silently successful |
| Missing callback/status outage | Pending remains pending; bounded operator verification/retry, no fabricated confirmation |
| Payment observed after local expiry/cancel | Existing core rejects; open reconciliation case. Resolve approved delivery/refund action only with provider evidence and a reviewed transition, never ignore paid funds or force simulation |
| Paid but asset unavailable | Show delivery issue, keep payment fact, alert operator; authorized retry or refund process |
| Lost session/device | Verified recovery/support path; no public UUID lookup or email-only release |
| Refund/dispute | Request ≠ completed refund; preserve confirmation, provider evidence and entitlement policy; reconcile settlement separately |
| Deployment/database incident | Disable new checkout, preserve receipts, recover/reconcile external changes before reopening |

D1 and external invoice creation, R2 access and notifications are not one distributed atomic transaction. Durable receipts and compensating/recovery procedures are mandatory. No “exactly once external delivery” guarantee.

## 8. Build dependencies and launch order

Preserve engineering phases 0–8. They are gates, not a mandatory waterfall for every independent task.

1. Finish Phase 3 real sandbox/deployed transaction verification with isolated DB, supported environment, narrow initiation, status/callback/replay/exception evidence. Production connectivity does not close it.
2. In parallel, approve one real launch brief/package and design/read-only storefront work when separately authorized. These do not need a working payment provider. Keep paid CTA disabled until gates pass.
3. Phase 4 connects publication, customer access, checkout, payment-gated private delivery and operator support in one non-production loop. Phase 6 **baseline controls are dependencies here**, not postponed.
4. Phase 7 controlled production release requires Phase 3 live evidence, Phase 4 integrated proof and baseline security/recovery. Additive remote migrations, key rotation and real payment require explicit authorization; no switch-flip assumption.
5. Phase 5 manual eligible external channel pilot and Brand/Demand can progress independently where policy/fulfillment permit. Broader distribution/ads wait for working delivery and measured economics, not all marketplace adapters.
6. Phase 6 deeper operational ergonomics/monitoring and Phase 8 automation follow demonstrated load. They do not postpone launch-critical controls.

The first next build objective is specified in docs/15: **one canonical launch candidate + publish/read-only customer product page**, alongside a separately tracked Phase 3 live blocker. It does not authorize paid execution now.

## 9. Minimal commercial evidence

Measure qualified offer visits/inquiries → checkout attempts → distinct confirmed orders → fulfilled/access-ready orders → customer use/feedback. Record product/version/offer, destination/source and environment. Test/operator-controlled transactions must be excluded from demand/revenue-validation claims.

Payment confirmation ≠ settlement ≠ recognized revenue/profit. Report verified gross paid amount, actual fees/refunds, recorded variable delivery/support/ad cost and unknown costs separately. Use [27](27-commercial-validation-and-metrics.md); choose experiment windows and spend caps before starting. No paid ads without owner-approved budget, policy review, working conversion/delivery and plausible contribution margin.

## 10. Official research — reviewed 2026-10-01

- **S1:** https://docs.duitku.com/pop/id/ — server createInvoice, hosted redirect alternative, server callback. Authentication check does not prove full payment/status compatibility.
- **S2:** https://developers.cloudflare.com/d1/platform/limits/ — account/database/query limits are plan-dependent; verify actual quota, never delete unrelated databases or share production to create staging.
- **S3:** https://developers.cloudflare.com/d1/reference/time-travel/ — recovery history is 7 days Free / 30 days Paid. Restore overwrites data and cancels in-flight queries; recovery must reconcile payments occurring after the restore point. No restore rehearsal performed in this audit.
- **S4:** https://developers.cloudflare.com/r2/api/workers/workers-api-usage/ — Worker binding can stream objects; application authorization must protect operations. R2 is not an entitlement system.
- **S5:** https://developers.cloudflare.com/turnstile/get-started/server-side-validation/ — server Siteverify required; tokens single-use, five-minute validity; validate hostname/action and separate retries from commerce idempotency.
- **S6:** https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/ — per-location, permissive/eventually consistent, not accounting. Verify Pages/BYOK binding support before choosing it; never use process memory as durable protection.
- **S7:** https://seller-id.tokopedia.com/university/essay?knowledge_id=7753815881352962 — Indonesia sections 5.4/5.5 currently do not support virtual products/services. TikTok social demand is distinct from TikTok Shop checkout. US rules cannot be applied to Indonesia.
- **S8:** https://help.etsy.com/hc/en-us/articles/115015628347-How-to-Manage-Your-Digital-Listings — seller-made/designed digital items; instant vs made-to-order, five files up to 20 MB each. Account/payout/country/fees still require admission review.
- **S9:** https://lynk.id/terms — rights, delivery obligations, dispute/withdrawal rules; official page supports product/service offers but is not proof of this account's eligibility or tested checkout. Confirm current fees and ambiguous translated conditions through dashboard/support.

No blanket Shopee/Gumroad/account eligibility verified here. Recheck exact product, country and account before each listing. Source review is research, not provider/account approval, legal advice or business validation.
