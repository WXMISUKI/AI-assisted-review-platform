## MODIFIED Requirements

### Requirement: Intake candidate preview workspace
The system SHALL show an operator-facing intake candidate preview before basis and master-data confirmation actions are treated as formal platform intake.

#### Scenario: Operator opens material-intake page after rectification rerun
- **WHEN** a current run has a previous archived run in the same workspace
- **THEN** the material-intake page shows which current basis and master-data assets are reused from the previous archived run
- **AND** it separately shows which assets are newly introduced or still need reconfirmation for the current run

### Requirement: Current-run candidate scoping
The intake candidate preview SHALL focus on records relevant to the currently selected run rather than the full workspace catalog.

#### Scenario: Operator reviews current run candidate preview during rerun
- **WHEN** the selected run is a rectification rerun
- **THEN** the preview continues to scope all asset summaries to the current run
- **AND** it uses the previous archived run only as a comparison baseline rather than replacing the current-run focus
