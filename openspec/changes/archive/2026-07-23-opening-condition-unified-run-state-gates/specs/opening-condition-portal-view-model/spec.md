## MODIFIED Requirements

### Requirement: Shared portal UI state derivation
The system SHALL derive a shared operator-facing portal state for the opening-condition workspace rather than scattering mutability rules across individual components.

#### Scenario: Archived run is displayed
- **WHEN** the selected backend pilot run is archived
- **THEN** the shared portal state marks the current run as archived
- **AND** downstream pages can consistently determine that the run is read-only
- **AND** downstream pages can access operator-readable reasons for disabled mutation actions

#### Scenario: Rerun intake mode is requested
- **WHEN** the operator explicitly starts the next rectification rerun
- **THEN** the shared portal state marks rerun intake as enabled for upload actions only
- **AND** the archived run itself remains read-only for mutation actions

#### Scenario: Action gates are consumed by pages
- **WHEN** a page needs to render current-run mutation controls
- **THEN** it SHALL consume the shared portal action gates rather than deriving archived, readiness, or rerun branching locally

### Requirement: Shared mutation guardrails
The system SHALL expose shared booleans and action gates for current-run mutation and rerun-upload capability.

#### Scenario: Material-intake page renders controls
- **WHEN** the page renders upload, execution-console, or gate-confirmation actions
- **THEN** it consumes shared state instead of duplicating archived/current/rerun branching logic in each section

#### Scenario: Archived run remains locked during rerun mode
- **WHEN** rectification rerun mode is enabled while the selected run is archived
- **THEN** the portal state allows only next-run upload creation
- **AND** current-run initialization, publication, knowledge-base binding, matching, report generation, archive, and human-review mutation remain unavailable
