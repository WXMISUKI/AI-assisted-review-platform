# streaming-review-workbench Specification

## Purpose
Define the streaming review workbench and locked loading experience, including recoverable backend-driven progress.
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

### Requirement: Section-aware loading summary
The streaming review workbench SHALL present the current section as part of the locked loading context.

#### Scenario: Recovered structure is available during loading
- **WHEN** a task has recovered sections and paragraphs before unlock
- **THEN** the loading view can show the current section, section count, and paragraph count alongside the pipeline progress

#### Scenario: Section is not yet known
- **WHEN** the pipeline has not yet recovered a current section
- **THEN** the loading view can fall back to the existing stage label and paragraph label

### Requirement: Recovered structure summary in locked streaming view
The streaming review workbench SHALL display a compact summary of the hydrated recovered structure while the task is still locked.

#### Scenario: Task is preparing for review
- **WHEN** the task has recovered sections and paragraphs but is not yet unlocked
- **THEN** the streaming view can show the recovered section list and paragraph counts alongside the pipeline progress

#### Scenario: Current section is known
- **WHEN** the recovered structure includes a current section or paragraph id
- **THEN** the locked streaming view can surface that current location to help users understand what the system is processing

### Requirement: Draft issue summaries during review preparation
The streaming review workbench SHALL present structure-derived draft issue summaries while the task is in review-preparation loading.

#### Scenario: Structure-derived draft issues exist
- **WHEN** recovered structure produces deterministic draft issues
- **THEN** the loading view can show the corresponding issue summaries for the current stage or paragraph context

#### Scenario: No draft issues exist
- **WHEN** recovered structure does not produce draft issues
- **THEN** the loading view falls back to the existing stage template summaries and progress hints

### Requirement: Backend-driven loading progression
The streaming review workbench SHALL be able to advance review-preparation loading from backend SSE events when structure context is available.

#### Scenario: Backend SSE is available
- **WHEN** the loading flow receives backend review-agent events with stage and paragraph metadata
- **THEN** the loading view can update progress, current stage, and unlock timing from those events

#### Scenario: Backend SSE is unavailable
- **WHEN** the stream cannot be established or returns no usable structure context
- **THEN** the loading flow can continue using the local mock stage progression without changing the page contract

### Requirement: Structure-aware loading stage display
The streaming review workbench SHALL render structure-aware review-preparation stages when recovered structure is available.

#### Scenario: Task has recovered structure
- **WHEN** a locked loading task has a recovered structure snapshot
- **THEN** the loading page can render the stage title, detail, outline, and issue summaries from the structure-derived review-preparation stages

#### Scenario: Task has no recovered structure
- **WHEN** a locked loading task does not have recovered structure
- **THEN** the loading page continues to use the existing fallback loading stages without changing the page contract
