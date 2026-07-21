## Why

The pilot can already reach human review and report generation, but the report package still mainly shows counts. For a real trial delivery, operators need the archived report to explain which human-review items were confirmed, corrected, or rejected, and why.

## What Changes

- Add a bounded human-review decision ledger to opening-condition pilot report package diagnostics.
- Persist only safe, operator-facing review fields in the report package: target, status, reason, safe note, evidence refs, reviewer, and decided time.
- Render the human-review decision ledger on the report archive page as part of the task-owned delivery summary.
- Keep archived report packages immutable after archive.

## Capabilities

### New Capabilities
- `opening-condition-human-review-decision-ledger`: Defines a bounded human-review decision ledger for report-ready and archived pilot packages.

### Modified Capabilities
- `opening-condition-real-sample-trial-package`: Report package content now includes bounded human-review decision ledger entries.
- `opening-condition-pilot-execution-console`: Report archive page now renders task-owned human-review decision ledger entries.
- `opening-condition-pilot-operational-api`: Report-generation responses include the new bounded human-review decision ledger fields.

## Impact

- Backend: `server/openingConditionPilotStore.mjs`, `server/openingConditionPilotStore.test.mjs`
- Frontend: `src/domain/openingConditionPilot.ts`, `src/productWorkspacePages.tsx`
- Docs: `docs/opening-condition-human-review-delivery-handoff.md`
- No new dependencies, no database migration, no provider contract changes.
