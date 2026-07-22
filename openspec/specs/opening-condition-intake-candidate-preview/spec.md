# opening-condition-intake-candidate-preview Specification

## Purpose
TBD - created by archiving change opening-condition-intake-preview-confirmation. Update Purpose after archive.
## Requirements
### Requirement: Intake candidate preview workspace
The system SHALL show an operator-facing intake candidate preview before basis and master-data confirmation actions are treated as formal platform intake.

#### Scenario: Operator opens material-intake page after upload
- **WHEN** a pilot run has basis or master-data candidate records
- **THEN** the material-intake page shows a candidate preview workspace for the current run
- **AND** it explains which recognized records are still pending human confirmation versus already ready for formal platform use

### Requirement: Current-run candidate scoping
The intake candidate preview SHALL focus on records relevant to the currently selected run rather than the full workspace catalog.

#### Scenario: Operator reviews current run candidate preview
- **WHEN** the selected run has a bound basis candidate and required master-data candidates
- **THEN** the preview highlights the current basis candidate and the required master-data candidates for that run
- **AND** it does not require the operator to navigate to the broader publication catalog first

### Requirement: Preview actions align with formal intake semantics
The system SHALL explain that confirm and publish actions are the step that formally admits recognized records into platform-usable assets.

#### Scenario: Operator prepares to confirm recognized records
- **WHEN** the operator sees publish-basis or confirm-master-data actions from the intake page
- **THEN** the preview workspace explains that these actions move the recognized records from preview state into formal platform intake state

