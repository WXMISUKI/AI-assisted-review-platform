## ADDED Requirements

### Requirement: Unified current-run action gates
The system SHALL derive one shared set of action gates for opening-condition current-run mutation and next-run upload.

#### Scenario: Active run gates are exposed
- **WHEN** the selected pilot run is not archived, failed, or canceled
- **THEN** the shared gate model exposes whether initialization, basis publication, master-data confirmation, knowledge-base binding, formal matching, report generation, and archive actions are available
- **AND** each unavailable action includes an operator-readable reason

#### Scenario: Archived run locks current mutation
- **WHEN** the selected pilot run is archived
- **THEN** all current-run mutation actions are unavailable
- **AND** the unavailable reason explains that archived history is read-only and a new rectification run must be created for further work

#### Scenario: Rectification upload is separate from archived mutation
- **WHEN** the selected pilot run is archived and rectification rerun mode is enabled
- **THEN** the shared gate model allows new upload creation for the next run
- **AND** it keeps all mutation actions against the archived run unavailable

### Requirement: Shared gates drive operator controls
The system SHALL render opening-condition action controls from the shared gate model instead of local archived/readiness branching.

#### Scenario: Material intake renders execution controls
- **WHEN** the material-intake page renders task initialization, publication, knowledge-base, and formal matching controls
- **THEN** those controls use the shared gate model for disabled state and disabled reason

#### Scenario: Trial overview renders publication controls
- **WHEN** the Trial Intake Overview renders basis and master-data action controls
- **THEN** those controls use the shared gate model for disabled state and disabled reason

#### Scenario: History detail remains read-only
- **WHEN** the operator is inspecting an archived historical round
- **THEN** the page does not expose controls that mutate that historical run
- **AND** it routes continued work through the explicit rectification rerun entry
