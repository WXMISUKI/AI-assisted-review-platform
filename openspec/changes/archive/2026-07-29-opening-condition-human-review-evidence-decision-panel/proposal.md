## Why

The opening-condition human-review detail can already open a checklist item and submit a decision, but the operator still has to infer which task-owned evidence supports the item and whether the row is currently actionable. A production pilot needs a clearer decision surface before the final report can be trusted.

## What Changes

- Add a focused evidence summary panel to the human-review detail using task-owned evidence records linked to the selected checklist item.
- Add a decision-ledger status panel that shows whether the current row is open, deferred, or already decided, including reviewer/time/safe note when available.
- Keep decision submission routed through the existing backend human-review API; this change does not add a new persistence model.
- Preserve the current full-workbench review mode and content-fact preview behavior.

## Capabilities

### New Capabilities

<!-- None. -->

### Modified Capabilities

- `opening-condition-human-review-check-item-context`: Human-review detail adds task-owned evidence summaries and actionability context.
- `opening-condition-human-review-decision-ledger`: The UI exposes decision-ledger status before and after a decision.
- `opening-condition-pilot-execution-console`: The selected-task workbench shows evidence and decision status inside the review detail pane.

## Impact

- Frontend: `src/productWorkspacePages.tsx`, `src/styles/opening-condition.css`.
- Tests: `server/openingConditionPilotUiBoundarySmoke.test.mjs`.
- Specs: human-review context, decision ledger, and execution console.
- No backend API, provider, OCR, report generation, or construction-plan changes.
