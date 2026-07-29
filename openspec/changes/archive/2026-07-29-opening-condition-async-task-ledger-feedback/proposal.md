## Why

The opening-condition trial intake still waits for the full bootstrap and matching path before the new run appears in the task ledger. Operators need immediate platform-owned task feedback after starting parsing, while the agent-style workflow continues to advance from recorded task events.

## What Changes

- Add an async bootstrap mode for the opening-condition trial intake path: the backend persists the run and packet first, returns the task immediately, and continues deterministic matching in the background.
- Update the agent console intake completion path so the upload dialog closes after the persisted task is returned, selects the new run, and refreshes the task ledger while background events advance.
- Keep each new upload on a unique run task id and preserve previous history rows instead of replacing them.
- Record this as the next production direction alongside the remaining deferred work: deep PDF/OCR page extraction, legal rectification generation, and provider/RAG quality hardening.

## Capabilities

### New Capabilities

- `opening-condition-async-task-ledger-feedback`: Covers async run creation, immediate task-ledger feedback, and background workflow refresh for the opening-condition agent console.

### Modified Capabilities

- `opening-condition-pilot-workflow`: The pilot workflow gains an async bootstrap mode that records task creation before later matching completes.
- `opening-condition-pilot-execution-console`: The console shall show newly created runs immediately and keep refreshing selected task state while backend workflow events progress.

## Impact

- Backend: `server/openingConditionPilotStore.mjs`, `server/index.mjs`, focused HTTP/store smoke tests.
- Frontend: `src/domain/backendConnectivity.ts`, `src/productWorkspacePages.tsx`, `src/App.tsx`, UI boundary smoke tests.
- Docs/OpenSpec: this change records the next implementation direction and leaves provider, OCR, and legal-report generation out of scope.
