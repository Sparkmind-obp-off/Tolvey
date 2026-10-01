# TOLVEY — Distribution & Channel Admission Architecture

Status: target/manual-first channel specification; no account/listing/sales claim.
Updated: 2026-10-01.

## Separate the three engines

- **Own Commerce:** TOLVEY Shop is the canonical owned destination.
- **Distribution:** external storefront/marketplace may execute its own checkout.
- **Brand/Demand:** social/personal-brand/content/search creates qualified traffic to either destination. Ads are paid acquisition, not automatically another commerce platform.

`Canonical product/version/offer → approved listing/creative → audience → own or external transaction → fulfillment → verified evidence`.

Same product, many doors; channel listings are derived, not new master products. Channel-specific commercial offers/fees must be explicit; no second sale-price authority hidden in listing copy.

## Current policy review — 2026-10-01

| Channel | Appropriate initial role / evidence | Admission state for TOLVEY |
| --- | --- | --- |
| TOLVEY Shop | Owned catalog/customer purchase target | Foundation/production connection only; checkout/delivery not live |
| Lynk.id | Candidate Indonesian external product/service storefront | Official terms support offers and require IP/delivery obligations; account/category/fees/payout/test still unverified |
| Instagram / Threads / TikTok / X | Brand/Demand, real demonstration, permitted links | Choose one primary surface first; content/account/external-link/ad rules require review |
| TikTok Shop by Tokopedia (Indonesia) | **Not an approved digital-product/service checkout path** | Official current §5.4 virtual products and §5.5 services unsupported; do not list TOLVEY digital downloads/services or evade via fake physical goods |
| Etsy | Potential international seller-designed digital instant or made-to-order downloads | Official files up to five × 20 MB; seller/account/country/payout/fees/localization still unverified |
| Shopee / Gumroad | Candidate only if exact account/product/country rules fit | No eligibility approval or current category/fee confirmation claimed by this audit |
| Google Search / YouTube | Content/search demand, later compounding discovery | Useful when product page/content exist, not prerequisite to all engineering |

Indonesia TikTok Shop rules cannot be inferred from US rules or generic “digital products on TikTok” articles. TikTok social content can still be a demand route when permitted; social eligibility does not imply Shop category eligibility. Recheck official policy before future admission because rules can change.

## Execution priority, not all-platform inventory

1. One real launch candidate and working supported delivery destination.
2. One primary Brand/Demand channel with real product walkthrough/education and source-tagged link.
3. One external storefront candidate admitted through the checklist below; manual listing and evidence capture first. Lynk.id is a candidate, not guaranteed approval/performance.
4. Review qualified demand, fulfillment/support and economics before another channel, ads or an adapter.
5. International/marketplace expansion only if rights, format, seller/payout fit and operating capacity are demonstrated.

Do not require all social profiles, API integrations or marketplace listings before the first coherent product loop. Brand work can start during technical preparation, but a paid CTA needs a valid purchase/delivery path. External pilot proof does not close own-shop/Phase 3 payment gates.

## Channel admission checklist

Owner records review date and official source for:
- exact country, seller account and product category; digital/service eligibility;
- asset ownership/license and allowed claims/content;
- fulfillment format/file size, delivery timing, updates and access revocation;
- seller verification/payout availability, actual fees/settlement/refund/dispute rules;
- external-link/promotion/ad rules; no policy circumvention;
- canonical product/version and listing/offer mapping;
- customer support/consumer/privacy/tax obligations requiring review;
- tested purchase/delivery where authorized, and verifiable transaction evidence available;
- pause/removal and reconciliation plan.

Unknown/unsupported fails admission; listing remains DRAFT/PAUSED. External terms are not substitute legal advice or evidence that this account is activated.

## Manual channel record and normalized intake

Track channel, country, owner, product/version/offer, listing ID/URL, title/creative version, actual channel price/currency/fees, destination, publication/availability, policy source/date and review reminder. See docs/37 for truthful listing package and docs/38 for evidence intake.

External checkout does not create another Duitku invoice. Later additive unique external-origin intake preserves `(channel, external_order_id)` and verified status/amount/refund/fulfillment evidence; current own-shop checkout schema is not that implementation. Until intake exists, authorized manual register is explicitly provisional/not normalized; import reconciles stable IDs, no double-counted revenue.

## Official references / limits

Reviewed 2026-10-01:
- Indonesia TikTok Shop by Tokopedia Restricted and Unsupported Products Guidelines, §5.4/5.5: https://seller-id.tokopedia.com/university/essay?knowledge_id=7753815881352962 — page content retrieved, not merely third-party snippet.
- Etsy digital listing rules: https://help.etsy.com/hc/en-us/articles/115015628347-How-to-Manage-Your-Digital-Listings — seller-made/designed, instant/made-to-order and file limits; account admission still pending.
- Lynk.id terms: https://lynk.id/terms — ownership, fulfillment/dispute/withdrawal obligations; fees/account suitability require dashboard/support confirmation. Translated terms contain inconsistencies; do not infer resolved legal conditions.

No API/account probes, listing creation, purchase, ads/spend or channel approval performed in this documentation audit. Full system/commerce/service paths: docs/19; metrics: docs/27.
