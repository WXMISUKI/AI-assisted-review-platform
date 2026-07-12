## ADDED Requirements

### Requirement: Unified review task lifecycle snapshot
The system SHALL expose a unified lifecycle snapshot for each review task so OCR processing, structure recovery, review streaming, ready, completed, and failed states can be represented consistently across the app.

#### Scenario: Task is in OCR processing
- **WHEN** a task is submitted for OCR and has an OCR job state or progress
- **THEN** the lifecycle snapshot SHALL expose the OCR status, progress, and current OCR message in a normalized form

#### Scenario: Task is in review streaming
- **WHEN** a task has completed OCR and is advancing through review stages
- **THEN** the lifecycle snapshot SHALL expose the current stage, agent, section or paragraph context, and stage progress in a normalized form

#### Scenario: Task reaches a terminal state
- **WHEN** a task becomes ready, completed, or failed
- **THEN** the lifecycle snapshot SHALL preserve a stable human-readable summary that can be rendered by the document library and detail pages

### Requirement: Locked review loading state
The system SHALL keep the review loading view locked until the task is ready for interaction while still exposing live lifecycle progress to the user.

#### Scenario: OCR is still running
- **WHEN** a user opens a task whose OCR job is not complete
- **THEN** the loading view SHALL remain read-only and show OCR progress instead of enabling review actions

#### Scenario: Review preparation is still running
- **WHEN** a user opens a task that is in review streaming or structure recovery
- **THEN** the loading view SHALL remain read-only and show the current stage, section, or paragraph context instead of enabling review actions

#### Scenario: Task becomes ready
- **WHEN** a task reaches the ready state
- **THEN** the system SHALL allow the user to proceed to the review workbench without losing the current lifecycle snapshot

### Requirement: Backend-compatible task progress mapping
The system SHALL map mock progress updates and future backend events into the same task lifecycle snapshot contract.

#### Scenario: Mock or backend event advances progress
- **WHEN** a lifecycle event provides stage metadata, paragraph metadata, or OCR progress
- **THEN** the task orchestration layer SHALL update the same snapshot fields regardless of whether the source is mock data or backend data

#### Scenario: Task is reopened after refresh
- **WHEN** a user refreshes the page during OCR or review streaming
- **THEN** the task orchestration layer SHALL restore the last known stage, progress, and context from persisted task state

### Requirement: Review session remains service-backed
The system SHALL keep review task transitions behind a service boundary so page components do not directly assemble lifecycle state.

#### Scenario: Document library starts a task
- **WHEN** the document library starts OCR or review for a task
- **THEN** the service boundary SHALL produce the initial lifecycle snapshot and updated task status

#### Scenario: Review workbench advances stages
- **WHEN** the review workflow advances to the next stage or paragraph
- **THEN** the service boundary SHALL persist the new snapshot and expose it to the loading or workbench views
