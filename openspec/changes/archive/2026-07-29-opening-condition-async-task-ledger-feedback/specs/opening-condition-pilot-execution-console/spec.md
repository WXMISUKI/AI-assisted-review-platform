## ADDED Requirements

### Requirement: Intake completion selects the new ledger task
The opening-condition execution console SHALL select the newly created task returned by bootstrap intake and keep it visible in the project-scoped history list.

#### Scenario: New run is returned from bootstrap
- **WHEN** the intake action receives a task from the backend
- **THEN** the console upserts that task into all task lists
- **AND** the console selects that task for the agent detail view
- **AND** previous project tasks remain present unless explicitly deleted

### Requirement: Active selected tasks refresh while workflow progresses
The opening-condition execution console SHALL refresh active selected tasks while the backend workflow is still progressing.

#### Scenario: Task is in active workflow state
- **WHEN** the selected task state is draft, ready for packet, packet uploaded, extracting, matching, awaiting human review, or report ready without a ready report asset
- **THEN** the console periodically fetches the selected task by id and updates the ledger and detail view from backend facts
