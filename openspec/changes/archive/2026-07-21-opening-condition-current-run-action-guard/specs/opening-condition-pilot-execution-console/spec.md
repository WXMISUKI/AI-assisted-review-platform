## MODIFIED Requirements

### Requirement: Current trial run tracking
The opening-condition execution console SHALL keep operator actions scoped to the currently selected or newly bootstrapped pilot run.

#### Scenario: Refresh prefers current runnable run
- **WHEN** the current workspace has both archived tasks and a newer non-archived run task
- **THEN** the execution console refreshes onto the latest non-archived run instead of staying bound to an archived task

#### Scenario: Archived task becomes read-only
- **WHEN** the currently displayed backend task is archived
- **THEN** the execution console disables formal matching and other follow-on mutation actions and guides the operator to upload and initialize a new run
