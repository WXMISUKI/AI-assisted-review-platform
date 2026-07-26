## ADDED Requirements

### Requirement: Review task workbench
The opening-condition portal SHALL provide a task-list workbench as the primary MVP entry for pilot runs.

#### Scenario: Operator opens workspace overview
- **WHEN** a workspace has current or historical opening-condition pilot runs
- **THEN** the overview shows each run as a review task row with run id, review target, state, current owner, next action, issue counts, report status, updated time, and recommended action

#### Scenario: Operator opens recommended task action
- **WHEN** the operator clicks a task row's primary action
- **THEN** the portal navigates to the recommended execution page for that run state

#### Scenario: No run exists
- **WHEN** the selected workspace has no pilot run
- **THEN** the workbench guides the operator to the material-intake page to create the first review task

### Requirement: Task row issue summary
The opening-condition task workbench SHALL summarize AI findings and human-review needs without exposing internal provider diagnostics.

#### Scenario: Matching has produced check items
- **WHEN** a pilot task contains check items or human-review queue items
- **THEN** the task row shows counts for total check items, blocking or failed findings, and open human-review items

#### Scenario: Report exists
- **WHEN** a pilot task has a generated report asset
- **THEN** the task row shows report readiness and whether the task is archived
