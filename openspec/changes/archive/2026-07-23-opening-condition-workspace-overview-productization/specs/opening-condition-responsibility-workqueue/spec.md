## MODIFIED Requirements

### Requirement: Workspace responsibility workqueue
The system SHALL expose a workspace-level responsibility workqueue for the current opening-condition run.

#### Scenario: Operator opens workspace overview
- **WHEN** the selected workspace has a current or selected run
- **THEN** the overview shows the current owner, next action, due-state, blocker count, and recommended page
- **AND** it provides a primary action that routes the operator to the most relevant page for continuing that run

#### Scenario: Overview has no current run
- **WHEN** the selected workspace does not yet have a backend pilot run
- **THEN** the overview still explains that the next production action is to enter material intake and create the first run

#### Scenario: Workqueue explains delivery impact
- **WHEN** the responsibility workqueue is shown
- **THEN** it explains whether the run is waiting for intake, formal matching, human review, report delivery, archival history, or exception recovery
- **AND** the primary action is visually presented as the single recommended continuation path for that run context
