## 1. Shared State Model

- [x] 1.1 Add explicit current-run action gates with labels and disabled reasons to `OpeningConditionPortalViewState`.
- [x] 1.2 Preserve existing compatibility booleans while deriving them from the new action gates.
- [x] 1.3 Ensure archived runs lock all current-run mutations even when rectification rerun upload mode is active.

## 2. Page Wiring

- [x] 2.1 Wire `OpeningConditionPilotExecutionPanel` buttons to the shared action gates and reasons.
- [x] 2.2 Wire `Trial Intake Overview` basis/master-data/formal-match controls to the shared action gates and reasons.
- [x] 2.3 Keep report/history as the canonical entry for starting rectification rerun upload.

## 3. Verification And Docs

- [x] 3.1 Strengthen UI boundary smoke coverage for archived read-only gates and rerun upload separation.
- [x] 3.2 Update next-stage documentation with the unified state-gate priority.
- [x] 3.3 Run `npm run smoke:opening-condition:ui`.
- [x] 3.4 Run `npm run typecheck`.
- [x] 3.5 Run `openspec validate --changes opening-condition-unified-run-state-gates`.

## 4. Archive

- [x] 4.1 Sync delta specs into the main specs.
- [x] 4.2 Archive the completed OpenSpec change.
