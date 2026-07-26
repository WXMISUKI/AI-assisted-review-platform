## Why

The opening-condition MVP has the backend loop and report/archive facts, but the operator still sees too many execution surfaces. Before adding more AI agents or visual polish, the product needs one obvious task-ledger entry point that tells the operator which run to continue and where to go next.

## What Changes

- Strengthen the opening-condition task ledger as the primary MVP entry.
- Show selected-run MVP acceptance status from backend report diagnostics when available.
- Make task rows distinguish current run, historical read-only runs, report/archive relevance, and the recommended next page.
- Keep secondary execution pages reachable from task-row actions without turning the sidebar back into an internal diagnostic menu.
- Do not change matching rules, report generation, provider calls, database shape, permissions, or construction-plan flows.

## Capabilities

### New Capabilities
<!-- None. -->

### Modified Capabilities
- `opening-condition-pilot-execution-console`: task-ledger routing and selected-task handoff become the primary MVP operation path.

## Impact

- Frontend: opening-condition workspace shell and review task workbench in `src/productWorkspacePages.tsx`.
- Docs/specs: pilot execution console spec.
- Tests: lightweight UI smoke and typecheck where relevant.
- No new dependencies, provider calls, or backend API endpoints.
