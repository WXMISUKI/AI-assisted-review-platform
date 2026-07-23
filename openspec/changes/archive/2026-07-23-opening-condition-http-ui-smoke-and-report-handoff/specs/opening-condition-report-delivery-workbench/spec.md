## ADDED Requirements

### Requirement: Acceptance-oriented report workbench
The opening-condition report workbench SHALL prioritize acceptance and handoff actions over internal diagnostic density.

#### Scenario: Current run is report ready
- **WHEN** the selected current run is `report_ready` and has no report asset
- **THEN** the report workbench presents report generation as the primary delivery action
- **AND** supporting diagnostics are visible but secondary to the action and expected handoff outcome

#### Scenario: Current run is archived
- **WHEN** the selected current run is archived
- **THEN** the report workbench presents the archived report as read-only delivery history
- **AND** the only forward action is to start the next rectification round from the approved rerun entry

#### Scenario: Historical run is selected
- **WHEN** the selected run is not the active current run
- **THEN** the report workbench presents it as historical detail only
- **AND** it does not show report generation, archive, or next-rerun mutation actions for that historical selection
