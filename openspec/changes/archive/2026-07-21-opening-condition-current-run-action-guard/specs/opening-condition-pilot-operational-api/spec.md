## MODIFIED Requirements

### Requirement: Current workspace task discovery contract
The pilot operational API SHALL allow the frontend to discover the current runnable task for a workspace without mutating archived tasks.

#### Scenario: Task list can be used to resolve current run
- **WHEN** the frontend requests the pilot task list
- **THEN** the response includes task state, workspace context, and timestamps sufficient to select the latest non-archived task for a workspace

#### Scenario: Archived task rejects formal matching
- **WHEN** a formal-match request targets an archived task
- **THEN** the API returns a safe `invalid_state` response and does not mutate the archived task
