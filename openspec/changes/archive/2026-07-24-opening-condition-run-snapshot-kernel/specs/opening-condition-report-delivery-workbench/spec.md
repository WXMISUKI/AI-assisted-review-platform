## MODIFIED Requirements

### Requirement: Selected-run detail context
The system SHALL keep the report detail area synchronized with the run selected from history.

#### Scenario: Report and archive views share selected-run semantics
- **WHEN** the operator opens the report workbench or archive workbench for the same workspace
- **THEN** both pages use the same selected-run, current-run, and historical-readonly semantics
- **AND** the operator does not see conflicting rerun-entry or mutation guidance between those views

#### Scenario: Historical run is selected
- **WHEN** the selected run is not the active current run
- **THEN** the report workbench presents it as historical detail only
- **AND** it does not show report generation, archive, or next-rerun mutation actions for that historical selection
- **AND** if a rerun entry is shown anywhere on the page, it is tied only to the current archived run rather than the selected historical snapshot
