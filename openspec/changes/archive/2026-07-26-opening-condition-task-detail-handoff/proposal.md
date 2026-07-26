## Why

The opening-condition shell now starts from a task ledger, but each row still behaves mostly like a jump button. For MVP delivery, operators need a selected-task detail handoff that explains the current round, the remaining blockers, and the next action before they leave the workbench.

## What Changes

- Add a selected-task detail panel under the opening-condition task ledger.
- Show the selected run's stage progress, current owner, next action, issue counts, human-review count, report/archive state, and readonly state.
- Provide two clear actions from the detail panel: continue the recommended next action and open report/archive when available.
- Keep existing secondary pages unchanged and continue routing through the existing page IDs.
- Document this as the next interaction layer after sidebar navigation cleanup.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opening-condition-pilot-execution-console`: Task workbench rows gain a selected-task detail handoff and clear action routing.
- `opening-condition-context`: Workspace overview continues to frame the MVP around selected review tasks instead of internal diagnostics.

## Impact

- Frontend: `src/productWorkspacePages.tsx` and opening-condition CSS.
- Docs: task workbench interaction notes.
- No backend API change, no database migration, no provider integration.
