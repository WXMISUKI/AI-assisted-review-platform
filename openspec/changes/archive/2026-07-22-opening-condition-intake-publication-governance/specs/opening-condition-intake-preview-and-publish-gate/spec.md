## MODIFIED Requirements

### Requirement: Current run intake preview gate
The system SHALL present the current pilot run intake as a preview-and-publish gate before formal checklist matching.

#### Scenario: Operator reviews current run intake preview
- **WHEN** the operator opens the material-intake page for a bootstrapped or initialized run
- **THEN** the page shows the current run basis, required master data, knowledge-base binding, preview status, and next action before formal matching
- **AND** it references the published asset snapshot that the current run is expected to consume

#### Scenario: Preview gate distinguishes basis and master-data readiness
- **WHEN** the current run has unpublished basis or unconfirmed required master data
- **THEN** the page shows which part of the gate is still pending instead of presenting only a generic blocked state
- **AND** it distinguishes current-run binding readiness from broader workspace publication backlog

### Requirement: Explicit basis publish and master-data confirmation actions
The system SHALL provide explicit operator actions to publish the current run basis and confirm the current run master data before formal checklist matching.

#### Scenario: Operator publishes current run basis
- **WHEN** the current run is bound to a basis record that is not yet published
- **THEN** the execution console allows the operator to publish that basis and refresh the run readiness
- **AND** the publication governance page shows that basis version move from publish-ready to published

#### Scenario: Operator confirms current run master data
- **WHEN** the current run includes required master-data records that are not yet human-approved or published
- **THEN** the execution console allows the operator to confirm those records and refresh the run readiness
- **AND** the publication governance page shows which records are current-run facts versus still pending

#### Scenario: Operator resolves pending publication actions
- **WHEN** the current run has unpublished basis or unconfirmed required master data
- **THEN** the operator can identify those pending actions from both the intake gate and the publication governance page
- **AND** the gate summary distinguishes current-run binding ready from workspace catalog still having pending records
