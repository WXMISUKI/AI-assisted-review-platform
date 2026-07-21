## MODIFIED Requirements

### Requirement: Report package rendering
The report archive page SHALL display backend report package diagnostics for repeatable real-sample trials and SHALL surface findings-oriented delivery content for operator handoff.

#### Scenario: Report package exists
- **WHEN** a backend report asset includes package diagnostics
- **THEN** the report page shows the task-owned input summary, matching summary, human-review summary, provider/readiness blockers, report status, archive status, and findings-oriented delivery sections

#### Scenario: Archived package is shown
- **WHEN** the backend task is archived
- **THEN** the report page keeps the package visible, disables report generation, and hides archive action when the report asset is already archived

### Requirement: Current trial run tracking
The opening-condition execution console SHALL keep operator actions scoped to the currently selected or newly bootstrapped pilot run, while allowing archived runs to be revisited as history.

#### Scenario: Refresh follows current run id
- **WHEN** the portal has a current backend pilot task
- **THEN** the refresh action reloads that task id and its readiness instead of always using the workspace base task id

#### Scenario: Workspace switch resets current run
- **WHEN** the operator switches to another opening-condition workspace
- **THEN** the portal clears the current run and returns to that workspace base task lookup

#### Scenario: Real upload reports new run id
- **WHEN** real-file bootstrap creates a new run-specific task
- **THEN** the material-intake page displays the returned task id and state as the active pilot run

#### Scenario: Refresh prefers current runnable run
- **WHEN** the current workspace has both archived tasks and a newer non-archived run task
- **THEN** the execution console refreshes onto the latest non-archived run instead of staying bound to an archived task

#### Scenario: Archived task becomes read-only history
- **WHEN** the currently displayed backend task is archived
- **THEN** the execution console disables follow-on mutation actions but still allows the operator to inspect the archived run and its report as history

#### Scenario: Archived task becomes read-only
- **WHEN** the currently displayed backend task is archived
- **THEN** the execution console disables formal matching and other follow-on mutation actions and guides the operator to upload and initialize a new run

#### Scenario: Start next rectification round
- **WHEN** the operator starts a next rectification round from an archived run
- **THEN** the execution console guides the operator to upload a fresh basis/checklist/material package for a new run-specific task id
- **AND** the archived run is not reinitialized or mutated
