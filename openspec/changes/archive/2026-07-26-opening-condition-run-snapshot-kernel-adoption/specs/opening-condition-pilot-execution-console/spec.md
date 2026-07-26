## MODIFIED Requirements

### Requirement: Review task workbench
The opening-condition portal SHALL provide a task-list workbench as the primary MVP entry for pilot runs.

#### Scenario: Task row rectification summary is shown
- **WHEN** the task ledger renders rectification closure summary for a task row
- **THEN** the counts come from the shared run snapshot kernel rather than page-local duplicated closure logic

### Requirement: Selected task rectification rerun summary
The opening-condition selected-task detail handoff SHALL show the same compact rectification rerun summary when comparison data exists.

#### Scenario: Selected task and report page stay aligned
- **WHEN** the selected task has comparison data and the report page can render the same run
- **THEN** both views use the same shared previous-run and closure comparison facts
- **AND** the portal does not maintain a second page-local implementation of those rules
