## ADDED Requirements

### Requirement: Workspace overview shows selected review task context
The opening-condition workspace overview SHALL keep task context visible while operators decide the next action.

#### Scenario: Operator reviews the task ledger
- **WHEN** the operator opens the workspace overview
- **THEN** the page shows both the task ledger and a selected-task detail handoff before lower-priority governance diagnostics

#### Scenario: No task exists
- **WHEN** the selected workspace has no review task
- **THEN** the overview continues to guide the operator to material intake to create the first task
