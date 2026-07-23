# opening-condition-intake-preview-and-publish-gate Specification

## Purpose
Define the preview-and-publish gate between real-file intake and formal checklist matching for the opening-condition pilot.
## Requirements
### Requirement: Current run intake preview gate
The system SHALL present the current pilot run intake as a preview-and-publish gate before formal checklist matching.

#### Scenario: Operator reviews current run intake preview
- **WHEN** the operator opens the material-intake page for a bootstrapped or initialized run
- **THEN** the page shows the current run basis, required master data, knowledge-base binding, preview status, next action, and candidate preview before formal matching

#### Scenario: Preview gate distinguishes basis and master-data readiness
- **WHEN** the current run has unpublished basis or unconfirmed required master data
- **THEN** the page shows which part of the gate is still pending instead of presenting only a generic blocked state
- **AND** it keeps the candidate preview visible so the operator can inspect what is being confirmed

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

### Requirement: Intake gate explains basis preview status
The current run intake preview gate SHALL explain whether the run-bound basis is only provisional, confirmed, or published.

#### Scenario: Current run has provisional basis preview
- **WHEN** the current run is bound to a basis record whose preview still needs human confirmation
- **THEN** the intake gate shows the preview summary, extracted candidate facts, missing facts, confirmation status, extraction provenance, and a next action to confirm/publish basis before formal matching

#### Scenario: Current run has published basis preview
- **WHEN** the current run is bound to a basis record whose confirmed preview has been published
- **THEN** the intake gate marks the basis gate as ready and keeps the published version id visible

### Requirement: Formal matching uses only published basis
The opening-condition formal matching action SHALL remain blocked until the current run has a published basis version derived from a confirmed preview or other approved basis workflow.

#### Scenario: Operator attempts matching with unconfirmed basis preview
- **WHEN** the operator runs formal checklist matching while basis preview confirmation or publication is still pending
- **THEN** the backend rejects matching with a safe preflight status and next action

