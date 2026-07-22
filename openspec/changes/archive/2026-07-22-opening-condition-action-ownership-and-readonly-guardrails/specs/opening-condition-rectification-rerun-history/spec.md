## ADDED Requirements

### Requirement: Historical action ownership snapshot
The system SHALL preserve an operator-facing action ownership snapshot when a historical run is inspected.

#### Scenario: Operator opens historical round detail
- **WHEN** the workspace history contains archived rounds and the operator selects one
- **THEN** the detail view shows that round's owner/next-action semantics in read-only form
- **AND** the operator can distinguish those historical semantics from the current run's active responsibilities

#### Scenario: Operator compares current and previous rounds
- **WHEN** the report page compares the selected round with a previous archived round
- **THEN** the historical comparison keeps the archived round read-only
- **AND** it does not suggest mutation actions against the historical round
