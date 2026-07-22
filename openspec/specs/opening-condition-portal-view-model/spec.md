# opening-condition-portal-view-model Specification

## Purpose
TBD - created by archiving change opening-condition-state-and-style-foundation. Update Purpose after archive.
## Requirements
### Requirement: Shared portal UI state derivation
The system SHALL derive a shared operator-facing portal state for the opening-condition workspace rather than scattering mutability rules across individual components.

#### Scenario: Archived run is displayed
- **WHEN** the selected backend pilot run is archived
- **THEN** the shared portal state marks the current run as archived
- **AND** downstream pages can consistently determine whether the run is read-only

#### Scenario: Rerun intake mode is requested
- **WHEN** the operator explicitly starts the next rectification rerun
- **THEN** the shared portal state marks rerun intake as enabled for upload actions only
- **AND** the archived run itself remains read-only for mutation actions

### Requirement: Shared mutation guardrails
The system SHALL expose shared booleans for current-run mutation and rerun-upload capability.

#### Scenario: Material-intake page renders controls
- **WHEN** the page renders upload, execution-console, or gate-confirmation actions
- **THEN** it consumes shared state instead of duplicating archived/current/rerun branching logic in each section

