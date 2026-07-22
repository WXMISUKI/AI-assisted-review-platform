## MODIFIED Requirements

### Requirement: New rectification submission creates a new run
The system SHALL preserve a workspace-scoped history of opening-condition pilot runs for repeated rectification review.

#### Scenario: New rerun keeps reusable asset continuity
- **WHEN** the operator uploads rectified materials after a prior run has been archived
- **THEN** the new run remains a separate run in workspace history
- **AND** the portal explains which confirmed basis and master-data assets continue into the new run versus which assets are newly introduced or need reconfirmation
