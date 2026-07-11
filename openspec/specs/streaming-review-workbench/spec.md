# streaming-review-workbench Specification

## Purpose
TBD - created by archiving change review-workbench-scroll-preview-streaming. Update Purpose after archive.
## Requirements
### Requirement: Streaming review panels
The system SHALL provide a streaming review workbench state with outline, document, and issues panels.

#### Scenario: Streaming state starts
- **WHEN** review processing begins from the document library
- **THEN** the user sees staged AI progress alongside placeholder outline, document, and issue panels

#### Scenario: Streaming state completes
- **WHEN** the mock stream reaches completion
- **THEN** the system transitions to the normal review workbench

### Requirement: Streaming event model
The system SHALL model streaming progress as ordered events that can later map to SSE or WebSocket messages.

#### Scenario: Stage event is processed
- **WHEN** a stage event is received
- **THEN** the UI updates the current stage and progress timeline

#### Scenario: Issue event is processed
- **WHEN** an issue event is received
- **THEN** the UI appends the issue summary to the streaming issues panel

### Requirement: Session-backed streaming events
The streaming review workbench SHALL consume ordered review events from the review session service boundary.

#### Scenario: Streaming page opens
- **WHEN** a user starts or resumes a reviewing task
- **THEN** the streaming page renders the current ordered stage events from the task session state

#### Scenario: Streaming advances
- **WHEN** the mock stream advances to the next stage
- **THEN** the task session state records the current stage index so the review flow can resume consistently

### Requirement: Backend stream readiness
The streaming review workbench SHALL be compatible with backend server-sent review events.

#### Scenario: Backend streaming is enabled later
- **WHEN** review events arrive over SSE
- **THEN** the workbench can consume the same ordered event fields currently used by mock streaming stages

### Requirement: Recovered structure summary in locked streaming view
The streaming review workbench SHALL display a compact summary of the hydrated recovered structure while the task is still locked.

#### Scenario: Task is preparing for review
- **WHEN** the task has recovered sections and paragraphs but is not yet unlocked
- **THEN** the streaming view can show the recovered section list and paragraph counts alongside the pipeline progress

#### Scenario: Current section is known
- **WHEN** the recovered structure includes a current section or paragraph id
- **THEN** the locked streaming view can surface that current location to help users understand what the system is processing
