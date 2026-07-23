## MODIFIED Requirements

### Requirement: Execution console shows action ownership
The opening-condition execution console SHALL show the current run's action owner, next action, due-state, and action reason.

#### Scenario: Operator opens workspace overview
- **WHEN** the workspace overview is backed by a current or selected run
- **THEN** it can consume the same shared action ownership data as the execution console
- **AND** it shows the operator which page should be opened next to continue the run
