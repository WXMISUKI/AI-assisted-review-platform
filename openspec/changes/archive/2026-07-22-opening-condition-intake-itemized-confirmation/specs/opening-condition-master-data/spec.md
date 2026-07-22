## ADDED Requirements

### Requirement: Itemized master-data intake decisions
The opening-condition portal SHALL allow current-run master-data candidates to be individually approved or rejected from the intake preview workspace.

#### Scenario: Operator rejects one candidate and keeps others
- **WHEN** the current run includes multiple master-data candidates
- **THEN** the operator can reject one candidate while leaving the others available for approval
- **AND** the intake page refreshes the run state after the decision
