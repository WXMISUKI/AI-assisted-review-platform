## Why

The opening-condition MVP has the right backend loop, but the portal still exposes internal workflow steps as equal left-nav destinations. This conflicts with the interaction direction already documented from mature construction review platforms: operators should start from a task ledger, then drill into the needed action.

## What Changes

- Reframe the opening-condition left navigation around operator goals: task workbench, human review, report/archive, and follow-up asset governance.
- Keep material intake and checklist matching pages available as task-row recommended actions, but remove them from the primary left navigation.
- Keep page titles accurate when an operator drills into a hidden internal step from the task workbench.
- Document the distinction between primary task navigation and secondary execution-step pages.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opening-condition-context`: The workspace shell must prioritize task-ledger navigation over internal execution-step navigation.
- `opening-condition-pilot-execution-console`: Task-row actions must remain able to route to secondary execution pages that are not shown as primary nav entries.

## Impact

- Frontend only: opening-condition workspace navigation, page label lookup, and docs.
- No backend API change, no database migration, no provider integration.
- Existing pages remain mounted and reachable through task actions, preserving the current MVP test chain.
