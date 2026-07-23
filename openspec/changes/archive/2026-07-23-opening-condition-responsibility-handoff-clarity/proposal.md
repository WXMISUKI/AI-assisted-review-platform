## Why

The opening-condition pilot already has run states, report history, checklist matrix, and action ownership derivation, but the responsibility handoff surface is still not clear enough for trial production. Operators need to see who owns the next step, what is blocking delivery, and where to continue without reading raw state fields or ambiguous labels.

## What Changes

- Clarify the workspace responsibility workqueue so it reads as a production handoff panel instead of a technical status block.
- Clarify human-review grouping and labels so pending, deferred, and resolved review items are easy to scan.
- Keep recommended actions aligned with current-run and archived-run guardrails.
- Preserve the existing backend task model and frontend derived ownership logic; this change improves presentation and operator guidance only.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `opening-condition-action-ownership`: Clarify operator-facing labels and next-action wording for current owner, due state, action reason, and recommended page.
- `opening-condition-responsibility-workqueue`: Strengthen the responsibility board and human-review priority grouping as handoff surfaces.

## Impact

- `src/productWorkspacePages.tsx`: Update shared responsibility board, action ownership summary, and human-review queue headings/actions.
- `src/openingConditionPortalState.ts`: Normalize readable action ownership labels and next-action strings.
- `src/styles/opening-condition.css`: Add scoped workqueue and human-review grouping styles if needed.
- `openspec/specs/*`: Sync the clarified ownership and workqueue requirements after implementation.
