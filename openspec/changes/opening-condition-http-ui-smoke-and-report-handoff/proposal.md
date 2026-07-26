## Why

The opening-condition lifecycle gates are already stable in the backend and portal state, but they still need a retained HTTP/UI smoke boundary so archived runs, rerun entry, and report handoff semantics do not drift as the MVP continues to evolve.

## What Changes

- Add retained HTTP smoke coverage for archived-run immutability and next-run isolation.
- Add lightweight UI smoke coverage for read-only archived controls and rerun-only entry behavior.
- Keep the report handoff path explicit so operators can see the current vs historical run distinction without inferring it from internal state.

## Capabilities

### New Capabilities

- `opening-condition-http-ui-smoke-and-report-handoff`: smoke-level verification of archived immutability, rerun entry, and report handoff visibility for the opening-condition MVP.

### Modified Capabilities

- None.

## Impact

- Tests: `server/openingConditionPilotHttpSmoke.test.mjs`, `server/openingConditionPilotUiBoundarySmoke.test.mjs`.
- Frontend: `src/productWorkspacePages.tsx`, `src/App.tsx` only if a smoke-visible rerun/read-only label needs tightening.
- No backend API, database, or provider contract changes.
