# opening-condition-intake-itemized-confirmation Specification

## Purpose
TBD - created by archiving change opening-condition-intake-itemized-confirmation. Update Purpose after archive.
## Requirements
### Requirement: Itemized candidate decisions
The system SHALL allow the operator to make itemized intake decisions for current-run candidate records instead of only relying on bulk confirmation.

#### Scenario: Operator reviews candidate list
- **WHEN** basis or master-data candidate records are shown in the intake preview workspace
- **THEN** the operator can act on individual records without having to confirm the entire run at once

### Requirement: Safe note capture during intake decision
The system SHALL allow the operator to capture a safe note when formally admitting or rejecting a candidate record.

#### Scenario: Operator leaves a confirmation note
- **WHEN** the operator confirms or rejects a current-run candidate
- **THEN** the decision flow allows a safe note to be attached
- **AND** that note is submitted with the intake decision where the backend contract supports it

