## MODIFIED Requirements

### Requirement: Historical report drill-in
The system SHALL allow operators to inspect a specific historical run in detail from the workspace history list and understand its rectification difference against the previous archived run.

#### Scenario: Historical difference uses final operator-facing state
- **WHEN** the selected run or previous run contains human-reviewed checklist items
- **THEN** the rectification difference uses normalized operator-facing states instead of raw `needs_human_review` values
- **AND** an item already rejected by human review is not counted as pending human judgement

#### Scenario: Historical selection preserves single rerun entrance
- **WHEN** the operator selects a historical archived run from the history list
- **THEN** the detail view remains read-only
- **AND** the portal does not expose a new-rerun mutation entrance from that historical selection
- **AND** the next rectification rerun can only be started from the current archived run context
