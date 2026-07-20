## Why

Real-sample trial upload currently reuses the fixed task id `oc-pilot-{workspaceId}`. After a trial has been archived, the backend correctly refuses to reinitialize that immutable task, but the operator-facing workflow has no way to start the next repeatable run from the same workspace.

## What Changes

- Add a repeatable run identity rule for real-file opening-condition trials.
- Keep archived pilot tasks immutable; do not allow intake/bootstrap to overwrite an archived task.
- When the current workspace task is archived, the real-file upload flow creates a new run-specific task id and treats that returned task as the current run.
- Refresh and follow-on actions use the current run id after bootstrap, instead of falling back to the workspace base id.
- Update the operator runbook with the archived-run retry behavior.

## Capabilities

### New Capabilities
- `opening-condition-repeatable-trial-run-versioning`: Defines repeatable same-workspace real-sample trial runs while preserving archived task immutability.

### Modified Capabilities
- `opening-condition-pilot-execution-console`: Real-file trial bootstrap and refresh behavior must follow the current run id.
- `opening-condition-single-project-trial-intake`: Real-file intake must support a new run after an archived run exists.

## Impact

- Frontend: `src/App.tsx`, `src/productWorkspacePages.tsx`
- Backend tests: `server/openingConditionPilotStore.test.mjs`
- Docs: `docs/opening-condition-single-project-trial-runbook.md`
- No new dependencies, database migration, tenant model, or permission changes.
