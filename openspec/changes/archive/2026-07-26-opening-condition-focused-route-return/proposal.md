## Why

Focused routing now lets operators jump from the task ledger or report findings into checklist and human-review detail pages, but the focused destination only allows clearing focus. Operators still need to manually navigate back to the source page to continue the MVP loop.

## What Changes

- Track the source page for focused checklist and human-review navigation.
- Show a compact return action in focused checklist and human-review banners.
- Route back to the task ledger or report page according to the origin that created the focus.
- Keep focus origin transient and frontend-only; no task data, report data, human-review decisions, or archive state changes.

## Capabilities

### New Capabilities
<!-- None. -->

### Modified Capabilities
- `opening-condition-pilot-execution-console`: focused detail destinations can return operators to the originating MVP page.

## Impact

- Frontend: opening-condition workspace shell, checklist detail page, and human-review page in `src/productWorkspacePages.tsx`.
- Tests: UI smoke assertions for source-aware return routing.
- No backend API, provider, storage, report export, or construction-plan changes.
