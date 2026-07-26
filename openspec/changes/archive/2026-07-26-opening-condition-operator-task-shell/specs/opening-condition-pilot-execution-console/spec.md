## ADDED Requirements

### Requirement: Secondary execution pages remain reachable from task rows
The opening-condition task workbench SHALL keep routing operators to secondary execution pages when those pages are the recommended next action.

#### Scenario: Task requires intake or matching
- **WHEN** a task row recommends material intake or checklist matching
- **THEN** the operator can open that secondary page from the row action even though it is not a primary sidebar entry

#### Scenario: Task requires review or reporting
- **WHEN** a task row recommends human review or report archive
- **THEN** the operator can open the corresponding primary destination from the row action
