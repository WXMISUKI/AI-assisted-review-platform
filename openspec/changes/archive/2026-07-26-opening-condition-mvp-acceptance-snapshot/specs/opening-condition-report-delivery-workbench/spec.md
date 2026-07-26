## ADDED Requirements

### Requirement: Report workbench shows MVP acceptance snapshot
The opening-condition report delivery workbench SHALL show the selected run's MVP acceptance snapshot when report package diagnostics provide it.

#### Scenario: Current report-ready run is selected
- **WHEN** the selected current run has a report asset with `mvpAcceptance`
- **THEN** the report workbench shows the acceptance status, next action, current owner, and step checklist
- **AND** it keeps report generation, export, and archive actions as the primary controls

#### Scenario: Historical archived run is selected
- **WHEN** the selected run is archived
- **THEN** the report workbench shows the acceptance snapshot as read-only historical evidence
- **AND** it does not expose mutation actions for that historical run
