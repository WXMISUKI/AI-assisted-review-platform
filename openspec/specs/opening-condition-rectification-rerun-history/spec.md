# opening-condition-rectification-rerun-history Specification

## Purpose
TBD - created by archiving change opening-condition-rectification-rerun-and-report-delivery. Update Purpose after archive.
## Requirements
### Requirement: Workspace-scoped rerun history
The system SHALL preserve a workspace-scoped history of opening-condition pilot runs for repeated rectification review.

#### Scenario: Archived run remains as history
- **WHEN** a pilot run is archived after report generation
- **THEN** the workspace history keeps that run visible with its round identifier, created time, final state, and report summary

#### Scenario: New rectification submission creates a new run
- **WHEN** the operator uploads rectified materials after a prior run has been archived
- **THEN** the system creates a new run for the same workspace instead of overwriting the archived run

#### Scenario: New rerun keeps reusable asset continuity
- **WHEN** the operator uploads rectified materials after a prior run has been archived
- **THEN** the new run remains a separate run in workspace history
- **AND** the portal explains which confirmed basis and master-data assets continue into the new run versus which assets are newly introduced or need reconfirmation

#### Scenario: Operator starts a rectification rerun from archived report
- **WHEN** the currently visible run is archived and the operator chooses to start the next rectification review
- **THEN** the portal routes the operator to the material-intake page and labels the next real-file upload as a new rectification round
- **AND** the archived run remains read-only in workspace history
- **AND** material intake does not expose current-run mutation actions against the archived run while waiting for the new upload

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
