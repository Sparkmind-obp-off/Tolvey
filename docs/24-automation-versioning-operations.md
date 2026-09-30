# TOLVEY — Automation, Versioning & Operations

## 1. Operating principle
Automate repeated, verified work—not uncertain business assumptions.

Manual-first is acceptable when transaction volume is low.

## 2. Automation levels
### Level 0 — Manual
Operator performs the workflow and records evidence.

### Level 1 — Assisted
System prepares information/action; operator confirms.

### Level 2 — Automated
System performs a deterministic action with logs and retry safety.

### Level 3 — Adaptive
System optimizes based on accumulated real evidence.

TOLVEY should move upward only when evidence justifies it.

## 3. Candidate automations
- product publication/export
- channel listing synchronization
- payment callback processing
- fulfillment delivery
- customer status notifications
- transaction reconciliation
- analytics aggregation
- operational alerts

These are future capabilities, not current Phase 1 features.

## 4. Versioning
Version:
- products
- product assets
- API contracts when necessary
- database migrations
- deployment artifacts
- integration adapters

A ProductVersion represents a meaningful product revision. An Offer commercializes a selected version.

## 5. Release model
1. define bounded change
2. implement
3. test
4. deploy
5. verify
6. observe
7. retain evidence
8. continue or rollback

## 6. Git
- main is the delivery branch unless a later workflow explicitly changes it
- commits describe real changes
- no secrets
- remote SHA verified after push
- clean working tree at phase gates

## 7. Database versioning
Migrations are immutable history.

Never edit an already-applied migration to change production meaning. Add a new migration.

## 8. Automation safety
Every automated side effect should have:
- idempotency
- bounded retries
- observable failure
- correlation/reference ID
- safe terminal behavior

## 9. Scheduling
Scheduled jobs should be introduced only when:
- the task is deterministic
- manual repetition is demonstrated
- failure recovery is understood

## 10. Operator visibility
An operator should eventually be able to answer:
- what happened?
- when?
- for which product/order?
- through which channel/provider?
- what failed?
- was it retried?
- what is the current state?
- what action is safe next?
