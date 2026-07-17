## Why

The opening-condition pilot can already store tasks, basis versions, master data, knowledge bases, packets, and readiness, but it still relies on frontend-side orchestration to stitch them together. The next high-value step is a domain-owned intake/init entry that turns uploaded object references into a real pilot task with preflight readiness and formal-review gates wired in.

## What Changes

- Add a domain orchestration API for opening-condition pilot intake and task initialization without duplicating multipart upload endpoints.
- Allow the intake flow to bind a selected or auto-resolved published basis version, approved master-data references, an optional knowledge base, and packet object references in one backend-owned step.
- Persist basis-side safe source object references on the pilot task so contract or basis objects are traceable from the task itself.
- Return structured intake diagnostics and readiness output so the frontend can explain whether initialization succeeded, what was auto-bound, and what still blocks formal matching.
- Update the opening-condition operational panel to use the new orchestration entry instead of assembling task creation from multiple ad hoc calls.

## Capabilities

### New Capabilities
- `opening-condition-pilot-intake-orchestration`: Domain-owned initialization and packet intake contract for single-project opening-condition pilot tasks.

### Modified Capabilities
- `opening-condition-pilot-workflow`: Pilot workflow gains a formal intake/init orchestration path before packet matching.
- `opening-condition-pilot-operational-api`: Operational frontend and backend contracts gain a dedicated intake/init endpoint and result model.

## Impact

- Affected backend: `server/openingConditionPilotStore.mjs`, `server/index.mjs`, focused backend tests.
- Affected frontend: `src/domain/openingConditionPilot.ts`, `src/domain/backendConnectivity.ts`, `src/appShellPages.tsx`.
- Affected docs/specs: opening-condition pilot workflow docs and main OpenSpec specs.
- No new external configuration is required. Existing MinIO upload, basis, master-data, and knowledge-base configuration paths remain in place.
