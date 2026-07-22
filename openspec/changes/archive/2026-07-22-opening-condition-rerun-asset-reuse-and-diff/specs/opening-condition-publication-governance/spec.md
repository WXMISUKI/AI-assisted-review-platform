## MODIFIED Requirements

### Requirement: Current run binding snapshot
The system SHALL show which published or approved intake assets the current run is actually consuming.

#### Scenario: Operator reviews current run binding during rerun
- **WHEN** a current run has a previous archived run in the same workspace
- **THEN** the governance page shows a reuse snapshot for the current run
- **AND** it distinguishes reused assets, newly introduced assets, assets needing reconfirmation, and assets no longer used by the current run

### Requirement: Intake preview and governance continuity
The system SHALL keep the semantics of intake candidate preview and publication governance aligned.

#### Scenario: Operator compares intake and governance pages for the same rerun
- **WHEN** the operator moves between the intake preview page and the governance page for the same current run
- **THEN** both pages use the same asset reuse and difference semantics
- **AND** the operator does not need to reinterpret a record's meaning between the two pages
