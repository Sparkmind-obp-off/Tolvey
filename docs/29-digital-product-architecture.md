# TOLVEY Digital Product Architecture

Status: Draft for commercial catalog lock
Version: v1.0
Updated: 2026-09-30

## 1. Purpose

Layer 1 is the reusable **digital-product offering tier**: products that can be purchased, delivered, updated, bundled and distributed across eligible channels. It is not Engine 1 numbering. The three business engines are Own Commerce, Distribution and Brand/Demand (docs/39/34). Commercial statuses below are evidence vocabulary, distinct from implemented DRAFT/ACTIVE/ARCHIVED publication state; these wider fields/formats are specifications, not all implemented schema. Start one approved candidate/package, not the full hierarchy (docs/06/19).

TOLVEY is not positioned as a generic template dump or PLR marketplace. Products should solve a concrete job, contain a coherent workflow, and have clear ownership/licensing.

## 2. Product hierarchy

Product Family
→ Single Product
→ Kit
→ Bundle
→ Complete System

### Product Family
A customer problem domain such as Money, Business, UMKM, Creator, Freelancer, Solopreneur, AI Work, or Productivity.

### Single Product
One focused asset with one job.

Examples: Budget Tracker, HPP Calculator, Content Planner, Invoice Template.

### Kit
A coordinated set of assets solving a broader recurring workflow.

Examples: Money Kit, UMKM Kit, Creator Kit.

### Bundle
Two or more compatible Kits/Products sold together with a clear use case.

Examples: Money + Business Bundle, Creator Business Bundle.

### Complete System
A comprehensive digital operating package for one persona or use case.

Examples: Solopreneur Complete System, UMKM Complete System.

## 3. Product formats

Supported formats may include:
- Spreadsheet / dashboard
- PDF guide / workbook
- Notion or equivalent workspace
- Canva or editable design templates where licensing permits
- Prompt/workflow library
- Checklists and SOPs
- Calculators
- Digital files and resource packs
- Access links where technically justified

Every product must have a canonical source package and version.

## 4. Product metadata

Each catalog item must define:
- product_id
- family
- product_name
- product_type
- target_customer
- job_to_be_done
- problem
- promised outcome
- contents
- format
- version
- license
- price hypothesis
- bundle relationships
- fulfillment method
- support policy
- update policy
- distribution eligibility
- validation status

## 5. Commercial status

Use only:
- IDEA
- BUILDING
- READY_FOR_TEST
- LISTED
- FIRST_SALE
- VALIDATED
- ITERATING
- RETIRED

Do not call a product validated without actual customer evidence.

## 6. Design principles

1. Outcome before feature.
2. Practical before ornamental.
3. Reusable before bespoke.
4. Owned assets before third-party dependency.
5. Clear licensing.
6. One canonical product, many distribution channels.
7. No fake scarcity, fake testimonials, or unsupported income claims.
8. Every release is versioned.
9. Customer support scope is explicit.
10. Product quality is measured by use and purchase evidence, not catalog size.

## 7. Layer boundary

Layer 1 owns digital product commerce.

Layer 2 owns human-assisted implementation and custom services.

Distribution is a separate layer that publishes Layer 1 products and can generate qualified demand for Layer 2.

The transaction core remains provider-neutral and must not hard-code any marketplace or payment provider.
