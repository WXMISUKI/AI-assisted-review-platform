## ADDED Requirements

### Requirement: Archived intake actions are fully read-only
The opening-condition execution console SHALL disable every action that would mutate the currently displayed archived run unless the operator has explicitly entered rectification rerun mode.

#### Scenario: Operator opens material-intake page for archived run
- **WHEN** the selected backend task is archived
- **AND** the portal is not in explicit rectification rerun mode
- **THEN** the execution console disables reinitialize, basis publish, master-data confirm, formal matching, and knowledge-base binding actions
- **AND** the intake overview disables its publish and confirm actions as well

#### Scenario: Operator enters rectification rerun mode
- **WHEN** the operator starts the next rectification round from the report page
- **THEN** the archived run remains read-only as history
- **AND** the material-intake page only re-enables actions that create the new run instead of mutating the archived run

### Requirement: Execution console shows action ownership
The opening-condition execution console SHALL show the current run's action owner, next action, due-state, and action reason.

#### Scenario: Operator reviews current execution state
- **WHEN** the material-intake execution console is backed by a current or selected run
- **THEN** it shows who currently owns the next step
- **AND** it explains what action should be completed before the run can advance
