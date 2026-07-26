## Why

The report page already lists failed, blocked, warning, and pending-human-review findings, but operators still need to manually search for the same item in checklist or human-review pages. The next MVP improvement is to make each report finding actionable without expanding the review workflow.

## What Changes

- Add report-finding actions that route to the focused checklist detail for the finding's check item.
- Add a human-review route from report findings when the finding has a matching open or deferred review item.
- Reuse the existing transient focus state introduced for task-ledger routing.
- Keep report findings as read-only conclusions; routing must not mutate review decisions, task state, report assets, or archive state.

## Capabilities

### New Capabilities
<!-- None. -->

### Modified Capabilities
- `opening-condition-pilot-execution-console`: report findings can route operators to focused checklist and human-review destinations.

## Impact

- Frontend: opening-condition workspace shell and report delivery workbench in `src/productWorkspacePages.tsx`.
- Styles: reuse existing opening-condition focus styles where possible.
- Tests: extend UI smoke coverage for report-finding focused routing.
- No backend API, provider, storage, or construction-plan changes.
