## ADDED Requirements

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

### Requirement: Prioritized delivery findings
The system SHALL group report findings by delivery priority rather than only rendering one flat list.

#### Scenario: Selected run contains multiple finding types
- **WHEN** the selected run contains blocked, failed, pending-human-review, or warning findings
- **THEN** the report page groups those findings into operator-facing priority sections
- **AND** the operator can visually distinguish which groups require immediate rectification, manual judgement, or later follow-up
