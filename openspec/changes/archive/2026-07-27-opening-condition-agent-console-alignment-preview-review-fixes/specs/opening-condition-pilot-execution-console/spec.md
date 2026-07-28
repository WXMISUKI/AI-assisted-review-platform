## MODIFIED Requirements

### Requirement: Review task workbench
The opening-condition portal SHALL provide a task-list workbench as the primary MVP entry for pilot runs, and the currently active task detail SHALL always render from the newest platform task snapshot available in the page state.

#### Scenario: Operator opens workspace overview
- **WHEN** a workspace has current or historical opening-condition pilot runs
- **THEN** the overview shows each run as a review task row with run id, review target, state, current owner, next action, issue counts, report status, updated time, and recommended action

#### Scenario: Operator opens recommended task action
- **WHEN** the operator clicks a task row's primary action
- **THEN** the portal navigates to the recommended execution page for that run state

#### Scenario: No run exists
- **WHEN** the selected workspace has no pilot run
- **THEN** the workbench guides the operator to the material-intake page to create the first review task

#### Scenario: Current task state is refreshed in place
- **WHEN** the current task receives a human-review decision, report update, or derived inventory asset update
- **THEN** the selected task detail uses the newest current-task snapshot instead of an older duplicate from the historical list

### Requirement: Task ledger is the MVP primary entry
The opening-condition portal SHALL present the review task ledger as the primary MVP entry, SHALL keep the new-review home centered within the workspace shell, and SHALL treat material intake and checklist detail pages as task-routed execution pages.

#### Scenario: Operator opens opening-condition workspace
- **WHEN** the opening-condition workspace renders
- **THEN** the primary sidebar exposes the task ledger, human review, report archive, and asset governance destinations
- **AND** secondary execution pages are reachable from task-row or selected-task actions rather than as equivalent primary destinations

#### Scenario: Selected task needs a secondary execution page
- **WHEN** the selected task's recommended next action is material intake or checklist detail
- **THEN** the task ledger shows that destination as the selected task's primary continuation action
- **AND** the shell labels the active page as a secondary execution page with a route back to the task ledger

#### Scenario: No task is selected
- **WHEN** the operator lands on the new-review home with no active task
- **THEN** the agent entry stage stays centered in the available workspace content area
- **AND** the page grows with content instead of clipping the brand or upload entry to a fixed height
