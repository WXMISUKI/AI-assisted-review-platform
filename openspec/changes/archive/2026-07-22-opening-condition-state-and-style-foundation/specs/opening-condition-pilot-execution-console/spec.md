## ADDED Requirements

### Requirement: Execution controls use shared portal state
The opening-condition execution console SHALL rely on the shared portal view model for read-only and mutation gating.

#### Scenario: Archived run is shown in material-intake view
- **WHEN** the selected run is archived
- **THEN** the execution console, intake overview, and upload panel use the shared portal state to determine which controls remain read-only
- **AND** the same archived/current/rerun rule does not need to be redefined separately in each control group
