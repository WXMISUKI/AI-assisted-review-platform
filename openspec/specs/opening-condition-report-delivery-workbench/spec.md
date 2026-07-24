# opening-condition-report-delivery-workbench Specification

## Purpose
TBD - created by archiving change opening-condition-report-delivery-workbench. Update Purpose after archive.
## Requirements
### Requirement: Report delivery workbench
The system SHALL render the opening-condition report page as a delivery workbench centered on the selected run.

#### Scenario: Operator opens report page
- **WHEN** the report page is backed by a current or selected run
- **THEN** the page shows which round is currently selected, whether it is the current run or historical read-only history, and the run's delivery conclusion
- **AND** the top of the page provides a concise summary of the selected run's key delivery counts and current action context

### Requirement: Selected-run detail context
The system SHALL keep the report detail area synchronized with the run selected from history.

#### Scenario: Operator switches to a historical round
- **WHEN** the operator selects a historical run from the history list
- **THEN** the report detail area updates to that run's findings, decision ledger, closure comparison, and metadata
- **AND** the page clearly indicates that the selected round is read-only history rather than the active current run

#### Scenario: Report and archive views share selected-run semantics
- **WHEN** the operator opens the report workbench or archive workbench for the same workspace
- **THEN** both pages use the same selected-run, current-run, and historical-readonly semantics
- **AND** the operator does not see conflicting rerun-entry or mutation guidance between those views

### Requirement: Prioritized delivery findings
The system SHALL group report findings by delivery priority rather than only rendering one flat list.

#### Scenario: Selected run contains multiple finding types
- **WHEN** the selected run contains blocked, failed, pending-human-review, or warning findings
- **THEN** the report page groups those findings into operator-facing priority sections
- **AND** the operator can visually distinguish which groups require immediate rectification, manual judgement, or later follow-up

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
- **AND** if a rerun entry is shown anywhere on the page, it is tied only to the current archived run rather than the selected historical snapshot
