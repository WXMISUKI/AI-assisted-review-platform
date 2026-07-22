## MODIFIED Requirements

### Requirement: Intake candidate preview workspace
The system SHALL show an operator-facing intake candidate preview before basis and master-data confirmation actions are treated as formal platform intake.

#### Scenario: Operator opens material-intake page after upload
- **WHEN** a pilot run has basis or master-data candidate records
- **THEN** the material-intake page shows a candidate preview workspace for the current run
- **AND** it explains which recognized records are still pending human confirmation versus already ready for formal platform use
- **AND** it provides itemized actions for records that can be decided individually

### Requirement: Preview actions align with formal intake semantics
The system SHALL explain that confirm and publish actions are the step that formally admits recognized records into platform-usable assets.

#### Scenario: Operator prepares to confirm recognized records
- **WHEN** the operator sees publish-basis or confirm-master-data actions from the intake page
- **THEN** the preview workspace explains that these actions move the recognized records from preview state into formal platform intake state
- **AND** it distinguishes quick bulk actions from finer-grained itemized decisions
