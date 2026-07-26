## Why

The report page already shows rectification closure comparison, but the task ledger is the MVP primary entry. Operators should be able to see whether a rerun solved previous issues, carried issues forward, introduced new issues, or still needs human judgement without opening the report page first.

## What Changes

- Reuse the existing rectification closure diff logic for task ledger rows.
- Add a compact rectification summary to each task row when a previous archived run exists.
- Add the selected task's rectification summary to the handoff detail.
- Keep the summary read-only and derived from existing run facts; do not add backend fields, APIs, migrations, or provider calls.

## Capabilities

### New Capabilities
<!-- None. -->

### Modified Capabilities
- `opening-condition-pilot-execution-console`: task ledger rows and selected-task handoff expose compact rectification rerun comparison summaries.

## Impact

- Frontend: `src/productWorkspacePages.tsx`.
- Tests: `server/openingConditionPilotUiBoundarySmoke.test.mjs`.
- Specs: `openspec/specs/opening-condition-pilot-execution-console/spec.md`.
- No backend API, data persistence, provider, DOCX export, or construction-plan changes.
