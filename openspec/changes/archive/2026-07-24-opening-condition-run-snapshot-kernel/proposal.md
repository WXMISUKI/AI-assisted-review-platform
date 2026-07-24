## Why

The opening-condition pilot can already run current and historical rounds, but the report page, archive page, history list, and rectification rerun entry still each derive their own idea of "selected run", "current run", "read-only history", and "next action". That fragmentation is now the highest operational risk because it causes confusing duplicate entrances, inconsistent read-only semantics, and misleading "pending human judgement" signals even after a reviewer has already rejected an item.

## What Changes

- Add a shared run-snapshot kernel that derives one operator-facing fact model for selected/current/history runs inside a workspace.
- Unify report workbench and archive workbench around the same selected-run, current-run, and rerun-entry semantics.
- Normalize rectification-closure categories from final operator-facing dispositions, so rejected or corrected items are no longer treated as unresolved "pending human judgement".
- Keep "start next rectification rerun" as a single approved forward action only for the current archived run, while historical snapshots remain inspection-only.

## Capabilities

### New Capabilities
- `opening-condition-run-snapshot-kernel`: Shared derivation of selected-run facts, read-only semantics, rerun-entry availability, and closure-state summaries for workspace report/history views.

### Modified Capabilities
- `opening-condition-report-delivery-workbench`: Align report and archive workbenches with one shared selected-run fact model and one rerun-entry rule.
- `opening-condition-rectification-rerun-history`: Make historical comparison and closure-diff categories depend on final operator-facing state, not raw intermediate review labels.
- `opening-condition-action-ownership`: Extend action ownership usage from "current run only" to shared current/historical snapshot rendering while preserving read-only history semantics.

## Impact

- Affected code: `src/productWorkspacePages.tsx`, `src/openingConditionPortalState.ts`, and a new shared run-snapshot helper module in `src/`.
- Affected tests: `server/openingConditionPilotUiBoundarySmoke.test.mjs`.
- No backend API changes, no database migration, and no provider contract changes.
