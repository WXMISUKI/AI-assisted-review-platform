## MODIFIED Requirements

### Requirement: Historical report drill-in
The system SHALL allow operators to inspect a specific historical run in detail from the workspace history list and understand its rectification difference against the previous archived run.

#### Scenario: Operator opens a previous run
- **WHEN** the workspace history contains multiple runs and the operator selects one historical round
- **THEN** the report page shows that run's report summary, findings, decision ledger, and round metadata in a read-only detail view
- **AND** the operator can distinguish whether the selected run is the current run or an archived historical round

#### Scenario: Operator reviews historical run difference
- **WHEN** the selected historical round has an earlier archived round in the same workspace
- **THEN** the report page shows which previous problems were rectified, carried over, or newly added in that selected round

#### Scenario: Historical difference uses final operator-facing state
- **WHEN** the selected run or previous run contains human-reviewed checklist items
- **THEN** the rectification difference uses normalized operator-facing states instead of raw `needs_human_review` values

#### Scenario: History selection updates the delivery workbench
- **WHEN** the operator switches the selected run from the history list
- **THEN** the report delivery workbench updates its selected-run summary, findings, closure comparison, and decision ledger to match that run
- **AND** it preserves read-only history semantics for non-current rounds
