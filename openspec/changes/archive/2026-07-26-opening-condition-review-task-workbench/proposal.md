## Why

The opening-condition MVP already has the backend loop for intake, formal matching, human review, report export, archive, and rerun, but the current portal exposes too many internal readiness and governance panels. Operators need a task-list workbench that answers: what was submitted, what is processing, who must act, what problems were found, and where the report is.

## What Changes

- Add an opening-condition review task workbench as the primary MVP entry.
- Present runs as a task table with project/review target, state, owner, issue counts, report status, and next action.
- Let operators click a task to jump to the recommended execution page instead of reading internal system panels first.
- Keep asset governance pages available as follow-up capability, but not as the main MVP interaction.
- Document the new intended interaction model and future evidence-preview direction.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opening-condition-pilot-execution-console`: Add task workbench and task-row navigation for current and historical runs.
- `opening-condition-context`: Clarify that workspace overview is the task workbench entry for MVP execution.
- `opening-condition-report-handoff`: Ensure report readiness and archive state are visible from task rows.

## Impact

- Frontend: workspace overview becomes a task workbench for opening-condition runs.
- Existing backend task list and derived action ownership are reused.
- No database migration, no provider integration, no full visual redesign.
