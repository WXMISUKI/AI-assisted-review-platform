## Why

The task ledger can now show selected-run issues and pending human-review items, but operators still have to manually find the same item after navigating to checklist detail or human review. The next MVP improvement is focused routing: clicking an issue or review item should carry item context into the destination page.

## What Changes

- Add local opening-condition focus routing state for checklist items and human-review items.
- Add per-row actions in the selected-task issue and pending-review summaries.
- Render a compact focus banner on checklist detail and human-review pages when navigated from the task ledger.
- Clear focus when the operator leaves the focused item or switches context through another route.
- Do not change backend state, matching rules, human-review mutation behavior, report generation, provider integrations, or construction-plan flows.

## Capabilities

### New Capabilities
<!-- None. -->

### Modified Capabilities
- `opening-condition-pilot-execution-console`: selected-task details can route operators to focused checklist or human-review items.

## Impact

- Frontend: opening-condition workspace shell, task ledger, checklist detail page, and human review page in `src/productWorkspacePages.tsx`.
- Styles: opening-condition-specific CSS for the focus banner and focused rows.
- Tests: UI smoke assertions for focus routing semantics.
- No new dependencies or backend API endpoints.
