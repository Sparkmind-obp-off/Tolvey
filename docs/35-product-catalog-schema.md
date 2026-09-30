# TOLVEY Product Catalog Schema

Status: Canonical catalog specification
Version: v1.0
Updated: 2026-09-30

## Purpose
Define the minimum commercial record for every TOLVEY product.

## Required fields
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
