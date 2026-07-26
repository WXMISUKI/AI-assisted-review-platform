## Why

Opening-condition review has enough backend pieces to run the single-project pilot, but the MVP completion judgment is still mostly a frontend interpretation. A report or archived run should carry a stable acceptance snapshot that says which pilot steps completed, what still blocks delivery, and where the operator should go next.

## What Changes

- Add a backend-owned MVP acceptance snapshot to opening-condition report package diagnostics.
- Persist or refresh that snapshot when report assets are generated, DOCX export feedback is recorded, and tasks are archived.
- Render the snapshot on the report delivery workbench so the selected run has one clear completion/handoff summary.
- Extend the opening-condition smoke to verify the snapshot through report, export, and archive states.
- Do not change formal matching rules, provider integration, upload flow, permissions, or database storage.

## Capabilities

### New Capabilities
<!-- None. -->

### Modified Capabilities
- `opening-condition-pilot-operational-api`: report package diagnostics include a bounded MVP acceptance snapshot.
- `opening-condition-report-delivery-workbench`: the report workbench shows the selected run's backend acceptance snapshot.
- `opening-condition-pilot-acceptance-smoke`: smoke verifies the acceptance snapshot across report/export/archive.

## Impact

- Backend: `server/openingConditionPilotStore.mjs`, existing opening-condition smoke.
- Frontend: opening-condition report page and shared type contract.
- Specs/docs: operational API, report delivery workbench, acceptance smoke.
- No new external services, dependencies, database migration, or provider calls.
