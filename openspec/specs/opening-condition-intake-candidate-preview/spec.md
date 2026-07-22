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
- **AND** it provides itemized actions for records that can be decided individually

#### Scenario: Operator opens material-intake page after rectification rerun
- **WHEN** a current run has a previous archived run in the same workspace
- **THEN** the material-intake page shows which current basis and master-data assets are reused from the previous archived run
- **AND** it separately shows which assets are newly introduced or still need reconfirmation for the current run

### Requirement: Current-run candidate scoping
The intake candidate preview SHALL focus on records relevant to the currently selected run rather than the full workspace catalog.

#### Scenario: Operator reviews current run candidate preview
- **WHEN** the selected run has a bound basis candidate and required master-data candidates
- **THEN** the preview highlights the current basis candidate and the required master-data candidates for that run
- **AND** it does not require the operator to navigate to the broader publication catalog first

#### Scenario: Operator reviews current run candidate preview during rerun
- **WHEN** the selected run is a rectification rerun
- **THEN** the preview continues to scope all asset summaries to the current run
- **AND** it uses the previous archived run only as a comparison baseline rather than replacing the current-run focus

### Requirement: Preview actions align with formal intake semantics
The system SHALL explain that confirm and publish actions are the step that formally admits recognized records into platform-usable assets.

#### Scenario: Operator prepares to confirm recognized records
- **WHEN** the operator sees publish-basis or confirm-master-data actions from the intake page
- **THEN** the preview workspace explains that these actions move the recognized records from preview state into formal platform intake state
- **AND** it distinguishes quick bulk actions from finer-grained itemized decisions
