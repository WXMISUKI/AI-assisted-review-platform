## ADDED Requirements

### Requirement: Workspace-scoped rerun history
The system SHALL preserve a workspace-scoped history of opening-condition pilot runs for repeated rectification review.

#### Scenario: Archived run remains as history
- **WHEN** a pilot run is archived after report generation
- **THEN** the workspace history keeps that run visible with its round identifier, created time, final state, and report summary

#### Scenario: New rectification submission creates a new run
- **WHEN** the operator uploads rectified materials after a prior run has been archived
- **THEN** the system creates a new run for the same workspace instead of overwriting the archived run

#### Scenario: Operator starts a rectification rerun from archived report
- **WHEN** the currently visible run is archived and the operator chooses to start the next rectification review
- **THEN** the portal routes the operator to the material-intake page and labels the next real-file upload as a new rectification round
- **AND** the archived run remains read-only in workspace history

### Requirement: Controlled history disposal
The system SHALL treat formal run history as retained records and allow only controlled soft deletion for operator mistakes or test data.

#### Scenario: Operator views formal history
- **WHEN** a workspace contains archived runs
- **THEN** those runs remain viewable by default and are not removed by starting a new run

#### Scenario: Administrator soft deletes a mistaken run
- **WHEN** an authorized operator marks a run as deleted for cleanup
- **THEN** the system hides it from the default history list while preserving minimal audit metadata

#### Scenario: Operator hides a test run locally
- **WHEN** the operator hides a mistaken or test run from the history list during the pilot
- **THEN** the portal hides it from the default report-history list and preserves local audit metadata containing the run id, time, and reason

### Requirement: Historical report drill-in
The system SHALL allow operators to inspect a specific historical run in detail from the workspace history list.

#### Scenario: Operator opens a previous run
- **WHEN** the workspace history contains multiple runs and the operator selects one historical round
- **THEN** the report page shows that run's report summary, findings, decision ledger, and round metadata in a read-only detail view
- **AND** the operator can distinguish whether the selected run is the current run or an archived historical round
