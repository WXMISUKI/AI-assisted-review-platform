## MODIFIED Requirements

### Requirement: Repeatable real-file intake diagnostics
The single-project trial intake SHALL make real-file intake repeatable by returning and displaying bounded diagnostics for uploaded basis, checklist, and material packet objects.

#### Scenario: Material intake shows task-owned overview
- **WHEN** a real-file bootstrap succeeds or the operator refreshes the current run
- **THEN** the material-intake page shows the current run id, task state, bound basis version, required master data summary, knowledge-base summary, checklist-definition resolution, inventory count, provider readiness, blocking reasons, and next action

#### Scenario: Intake overview distinguishes knowledge-base existence from readiness
- **WHEN** the current run is bound to a knowledge base record that is not yet ready for formal review
- **THEN** the material-intake overview shows both the bound knowledge-base label and its readiness state
- **AND** the overview keeps the blocker reason actionable instead of implying that the knowledge base is already usable

#### Scenario: Re-initialization preserves real uploaded object references
- **WHEN** the operator re-initializes a real-file trial run from the material-intake page
- **THEN** the request reuses the run's persisted basis/checklist/material object references instead of replacing them with demo packet data
- **AND** if persisted real object references are no longer available, the page tells the operator to upload and bootstrap a new run rather than silently overwriting the run with demo references
