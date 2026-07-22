## ADDED Requirements

### Requirement: Adjacent run rectification diff
The system SHALL compare a selected opening-condition run with the previous archived run in the same workspace and derive rectification closure status for problem items.

#### Scenario: Previous failed item is now passing
- **WHEN** a check item was failed, blocked, or pending human review in the previous archived run
- **AND** the same check item is passing or not present as a problem in the selected run
- **THEN** the report view classifies it as rectified

#### Scenario: Previous problem continues
- **WHEN** a check item was a problem in the previous archived run
- **AND** the same check item is still failed, blocked, warning, or pending human review in the selected run
- **THEN** the report view classifies it as carried over

#### Scenario: Current run introduces a new problem
- **WHEN** a check item is a problem in the selected run
- **AND** the same check item was not a problem in the previous archived run
- **THEN** the report view classifies it as newly added

### Requirement: Rectification closure handoff
The system SHALL provide a concise rectification handoff summary derived from adjacent run comparison.

#### Scenario: Operator reviews current report
- **WHEN** a selected run has a previous archived run for comparison
- **THEN** the report view shows counts for rectified, carried-over, newly-added, and pending-human-review items
- **AND** the view lists representative items with category, previous status, current status, and next action guidance
