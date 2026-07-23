## MODIFIED Requirements

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
