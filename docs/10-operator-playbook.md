# TOLVEY — Operator Full-Cycle Playbook

Updated: 2026-10-01. Operating specification; workflows below are not all implemented.

## Roles and manual-first rule

Founder approves product promise/price/policies and spend. Product creator builds/QA/version-controls assets. Commerce operator publishes, supports and reconciles. Brand/distribution operator owns content/listings. Engineer owns implementation/security/release. One person may hold these roles; responsibility still must be explicit.

Manual first → repeated verified process → selective automation. Manual publication/support is acceptable. Manual guesswork about payment or recipient identity is not. Current trusted D1 tooling is not a complete reviewed publication service; current connection token is diagnostic access, not general admin authority.

## 1. Launch brief — minimum real input

Record buyer, job/problem, outcome/limitations, contents/formats/compatibility, master asset location/version, ownership/license, price hypothesis/currency, delivery timing, support contact/window, refund/cancellation terms, channel eligibility, operator capacity and dated demand evidence.

Select one product; Money Kit remains optional hypothesis. If assets or price/policy approval are missing, keep DRAFT and specify what is missing. Never seed production with test examples or turn fabricated testimonials into launch copy.

## 2. Build/package/publication checklist

1. Test the actual files from a fresh recipient's perspective, including calculations, sample data, links and permissions.
2. Include Quick Start, license, compatibility, version/changelog and support instructions.
3. Store paid master package privately with immutable version/object key/hash; keep backup copy. Public preview cannot reveal paid deliverable.
4. Review offer price/version/terms, active-parent relations and package availability.
5. Authorized publication records reviewer/time and canonical IDs. Verify public page/CTA and safe DTO match the offer.
6. Before paid CTA: require provider live gate, customer access, delivery, baseline abuse/alerts/recovery and explicit release approval.
7. To pause: stop new purchases/listings; do not break existing purchased-version access or delete transaction history.

## 3. Daily commerce exception queue

Review pending/expired payment, RESERVED ambiguity, missing/late callback, confirmed-but-blocked/failed fulfillment, unresolved support/refund/dispute and deployment/provider incidents. Each case has order/channel reference, environment, safe reason code, first/last seen time, owner, next safe action and evidence/resolution.

The proposed queue/read view does not exist yet. Until an authorized pilot introduces it, current status must remain honest; inspecting SQL is not a finished operator UX.

### Reconciliation actions

| Case | Safe procedure |
| --- | --- |
| RESERVED / unknown external initiation | Inspect canonical reservation/receipt and approved provider status/support evidence; never delete/reset or issue another invoice blindly |
| READY / unattached payment | Retry attachment to the same provider receipt with stable key; do not recreate invoice |
| Pending / callback absent | Bounded server verification or provider escalation; retain pending if unknown; no browser/screenshot paid override |
| Late payment after expiry/cancel | Assign case, retain provider evidence; reviewed compensating delivery/refund decision needed; current core cannot be bypassed |
| Payment confirmed / delivery failure | Preserve payment fact, verify version/object/entitlement, retry authorized delivery once per command; contact customer or escalate refund |
| Conflicting/duplicate notification | Inspect safe reference/fingerprint/receipt; duplicates no extra grant/revenue, conflicts unresolved until verified |
| External checkout sale | Verify channel source and unique external order ID, canonical version, amount/currency, delivery and fees; no second Duitku invoice |

## 4. Customer support and recovery

Publish real contact and response expectations approved by operator; no invented 24/7 SLA. Issues: purchase/status, access/device loss, format/compatibility, content defect, service revision, refund/dispute.

Record minimal identity/contact and purpose, related order/version, category, message summary, action/time and outcome under restricted access. Verify requester ownership through secure session/recovery or a documented assisted evidence process; knowing email/order UUID alone cannot release private files. Do not collect card data/API credentials.

On-site status is the minimum communication path. Transactional email is introduced if required for reliable recovery; delivery failures remain visible even if an email send succeeds. Marketing requires separate consent/opt-out review.

## 5. Refund, dispute and settlement

REFUND_PENDING is a request, not returned money. Review policy/consumer obligations, provider/channel capability, approval, actual reference/amount/status, entitlement revocation policy and customer notice. Mark completed only through an implemented reviewed workflow with real provider evidence. Current application cannot execute/confirm refunds.

Daily/periodic reconciliation separately compares payment confirmations, actual fees/refunds and settlement/payout records. Gross paid amount is not profit; settlement delay/withholding/chargebacks remain visible. Do not edit or delete prior confirmation to disguise a refund.

## 6. Services

Service inquiry → qualification → explicit scope/capacity/dependencies → proposal/acceptance → agreed payment milestones → deliverables/revisions → acceptance/handoff → support. Record customer input deadlines, revision limit and change-control pricing. A kit purchase does not include implementation unless stated. DIGITAL fulfillment placeholder is not service completion; a client project must not alter master product files.

## 7. Brand and distribution work

Start one primary demand channel and one eligible commerce channel, not all platforms. Demonstrate real product use, teach the problem, answer inquiries and link to a working approved destination. Personal-brand trust and TOLVEY product claims remain truthful. Store source/campaign/creative/listing IDs and policy review date; never treat likes as sales.

Indonesia TikTok Shop virtual products/services are currently unsupported (docs/32); TikTok social content is a separate demand path. No policy evasion, fake physical shipment or assumed eligibility.

## 8. Weekly evidence review

Use docs/27: qualified offer visits/inquiries, checkout, distinct paid/fulfilled orders, delivery time/failures, support load, recorded refunds/fees/variable costs and real use feedback. Exclude local/sandbox/verification tests from commercial validation. Missing attribution/costs stay unknown.

Choose one action with rationale: improve product/offer/page, repair delivery, change channel, pause/archive, or continue experiment. Add products/channels/automation only when evidence justifies workload. Record experiment window, spend cap if any, expected signal, observed facts and next decision.

## 9. Incident/recovery launch checklist

Disable new checkout without deleting pending orders/receipts; preserve support/status and fulfilled access when safe. Investigate credential compromise, rotate through secure storage, review scope and alert owner. Rehearse isolated D1 recovery and app rollback; record pre-change bookmark/export, compatible artifact and recovery target. Database restore can discard post-bookmark internal facts while provider payments remain real: reconcile them before reopening. Do not run destructive restore on production as a casual test.

Current recovery rehearsal/full operator controls remain pending; this document does not claim them executed. Master full cycle and gates: docs/19 and docs/15.
