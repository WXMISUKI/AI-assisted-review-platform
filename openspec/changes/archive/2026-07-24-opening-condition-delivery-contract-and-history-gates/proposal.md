## Why

The opening-condition pilot can already run through intake, matching, human review, report generation, archive, and rectification reruns, but the delivery semantics are still split across page logic, report diagnostics, and run-state helpers. The next MVP step is to make the report handoff and historical run gates a stable platform-owned contract so a real pilot user can see what happened, who owns the next step, and where continued work must start.

## What Changes

- Add a bounded report delivery handoff contract to opening-condition report package diagnostics.
- Make report packages expose operator-facing delivery status, owner, next action, recommended page, read-only state, and blocking counts.
- Keep archived and historical runs inspectable as immutable delivery records while routing new work through the explicit rectification rerun entry.
- Render the delivery handoff on the report page so the operator does not need to infer meaning from internal task states.
- Extend smoke coverage so the generated report package proves it carries stable delivery handoff facts.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opening-condition-report-findings-delivery`: Adds report-level delivery handoff facts for owner, next action, delivery status, and read-only history semantics.
- `opening-condition-pilot-operational-api`: Adds the delivery handoff field to bounded report package diagnostics returned by the report API.
- `opening-condition-unified-run-state-gates`: Aligns archived/historical report rendering with the shared gate model so historical inspection cannot expose mutation actions.

## Impact

- Backend: `server/openingConditionPilotStore.mjs` report package normalization and derivation.
- Frontend types: `src/domain/openingConditionPilot.ts`.
- Frontend rendering: `src/productWorkspacePages.tsx` report delivery page.
- Tests: opening-condition store and smoke tests that verify report package diagnostics.
- Docs/OpenSpec only; no database migration, no multi-tenant permission platform, and no provider replacement.
