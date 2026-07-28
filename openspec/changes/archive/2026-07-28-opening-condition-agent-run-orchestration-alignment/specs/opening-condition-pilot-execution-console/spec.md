## ADDED Requirements

### Requirement: New-review uploads append run tasks
The opening-condition agent new-review upload flow SHALL create a distinct run task for each successful upload instead of reusing the workspace fallback task id or currently selected task id.

#### Scenario: Operator uploads a second review
- **WHEN** a workspace already has one or more pilot tasks and the operator starts a new review from the agent upload entry
- **THEN** the submitted task id is a new run-specific id
- **AND** the existing history rows remain available
- **AND** the newly returned task is selected immediately

#### Scenario: Upload completes
- **WHEN** the bootstrap API returns the created task
- **THEN** the history list includes the returned task without waiting for a manual browser refresh
- **AND** the selected detail binds to the returned task id

### Requirement: No-task refresh does not fetch fallback task detail
The opening-condition UI SHALL resolve current runs from the backend task list before requesting task detail and SHALL NOT fetch `oc-pilot-<workspaceId>` when the list contains no task for the workspace.

#### Scenario: Workspace has no tasks
- **WHEN** the task list for the selected workspace is empty
- **THEN** the UI shows the first-review empty state
- **AND** it does not issue a task-detail GET for the workspace fallback id

#### Scenario: Workspace has historical tasks
- **WHEN** the task list contains one or more tasks for the workspace
- **THEN** refresh selects a non-terminal task when available, otherwise a historical task
- **AND** detail fetches use that listed task id only

### Requirement: Checklist review rows use collision-free UI identity
The selected-task checklist review list SHALL render rows with collision-free UI ids while preserving the backend checklist target id for human-review decisions.

#### Scenario: Extracted checklist contains duplicate ids
- **WHEN** two checklist-derived review items share the same backend id such as `docx-4`
- **THEN** both rows render with distinct React keys
- **AND** opening a row routes to that row's detail instead of being collapsed into the first duplicate

#### Scenario: Human review decision is submitted
- **WHEN** an operator decides a checklist-linked review row
- **THEN** the decision still targets the backend human-review item associated with the original checklist target id
