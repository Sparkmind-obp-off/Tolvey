# TOLVEY Product Catalog Schema

Status: Canonical catalog specification
Version: v1.0
Updated: 2026-09-30

## Purpose
Define the minimum commercial record for every TOLVEY product.

## Implemented vs target mapping — audit 2026-10-01

This is a commercial record **specification**, not the implemented D1 table definition. Actual schema is immutable migrations 0001–0004 (docs/22): Product identity/slug/summary/publication state, ProductVersion/version/private metadata, Offer/version/authoritative integer money/private delivery reference, and local transaction/provider records. Family/type/license/outcome/support/channel eligibility/manifest and commercial evidence status are not all first-class persisted fields today.

For the first candidate, validate required business fields through a launch brief/publication service and add only queryable structured fields needed by its consuming capability. Publication DRAFT/ACTIVE/ARCHIVED is distinct from commercial IDEA/LISTED/FIRST_SALE/VALIDATED; ACTIVE never implies market validation. Offer alone owns sale price/currency/exponent; product price hypotheses/display copy must not become independent checkout money. Version asset manifest/hash and real package presence gate paid publication; service scope is separate from reusable digital assets. Bundles are deferred until component/version/grant rules are deliberately implemented.

## Required fields (target business record)
- product_id
- family
- product_name
- product_type
- target_customer
- job_to_be_done
- problem
- outcome
- contents
- format
- product_version
- license
- price_hypothesis
- currency
- bundle_memberships
- fulfillment_method
- support_policy
- update_policy
- distribution_eligibility
- commercial_status

## Product types
- FREE
- SINGLE
- KIT
- BUNDLE
- COMPLETE_SYSTEM

## Commercial statuses
IDEA → BUILDING → READY_FOR_TEST → LISTED → FIRST_SALE → VALIDATED → ITERATING → RETIRED.

## Required product package
Every READY_FOR_TEST product should contain:
- master files
- Quick Start
- usage instructions
- license
- example data where appropriate
- support instructions
- changelog
- cover/thumbnail
- preview assets
- marketplace listing copy
- canonical product ID
- version number

## Versioning
A material change creates a new product version. Fulfilled orders retain the version they purchased.

## Pricing
Prices are hypotheses until supported by transaction evidence. Record list price, promotional price if used, and currency separately.

## Bundle rule
A bundle has its own product ID and value proposition, while retaining references to its component products.
