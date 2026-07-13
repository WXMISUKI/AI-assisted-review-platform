# review-session-state Specification

## Purpose
TBD - created by archiving change review-session-state-and-service-boundary. Update Purpose after archive.
## Requirements
### Requirement: Review task aggregate
The system SHALL represent each document review as a review task aggregate containing document metadata, lifecycle status, role-compatible mode, review session data, and optional result asset.

#### Scenario: Task is listed
- **WHEN** the document library requests review tasks
- **THEN** each task includes document name, project name, uploader, updated time, status, review mode, issue count, and optional result asset metadata

#### Scenario: Task is opened
- **WHEN** a user opens a review task
- **THEN** the system can load the task's paragraphs, issues, current resolutions, streaming state, and result asset from the same aggregate

### Requirement: Review session service boundary
The system SHALL expose review workflow operations through a session service instead of requiring page components to assemble business state directly.

#### Scenario: Document task is created
- **WHEN** a user uploads or adds a document
- **THEN** the session service creates a review task with seeded document metadata and initial mock review data

#### Scenario: Review task is started
- **WHEN** a user starts review for a task
- **THEN** the session service marks the task as reviewing and provides ordered streaming events

#### Scenario: Issue decision is updated
- **WHEN** a user accepts or rejects an issue
- **THEN** the session service stores the updated issue resolution for that task

#### Scenario: Review is completed
- **WHEN** a user confirms completion
- **THEN** the session service stores the generated result asset and marks the task completed

### Requirement: Mock persistence
The system SHALL persist mock review task state in browser storage for MVP testing.

#### Scenario: User refreshes after editing
- **WHEN** a user refreshes the page after creating a task, resolving issues, or generating a result
- **THEN** the document library and task state are restored from mock persistence

#### Scenario: Stored data is invalid
- **WHEN** stored mock review data cannot be parsed or has an unsupported schema version
- **THEN** the system falls back to seeded mock tasks without blocking the UI

### Requirement: Backend-replaceable contract
The review session state contract SHALL avoid UI-only fields that prevent later replacement by backend APIs.

#### Scenario: Backend integration begins
- **WHEN** a future backend replaces the mock repository
- **THEN** the UI can continue using the same service-level operations for task listing, task loading, issue resolution, streaming updates, and completion

### Requirement: Backend event compatibility
The review session state SHALL reserve a backend event contract compatible with future replacement of mock streaming updates.

#### Scenario: Backend review event is received
- **WHEN** a backend event contains stage id, title, detail, progress, and issue summaries
- **THEN** it can be mapped to the existing review session streaming state without changing page-level UI contracts

### Requirement: Review pipeline snapshot
The review session state SHALL preserve a pipeline snapshot alongside the existing task aggregate so the UI can restore post-OCR progress after refresh.

#### Scenario: Task is reopened mid-pipeline
- **WHEN** the user refreshes or reopens an in-progress document
- **THEN** the task state restores the current pipeline stage, progress, and paragraph context

#### Scenario: Pipeline state is mutated
- **WHEN** the review session service advances the pipeline
- **THEN** the updated snapshot remains replaceable by future backend APIs without changing page-level state assembly

### Requirement: Backend-replaceable streaming contract
The review session state SHALL remain compatible with a backend event stream that can carry stage, paragraph, and agent metadata.

#### Scenario: Backend event is mapped
- **WHEN** a backend progress event is received
- **THEN** the session state can map it into the same restored task snapshot used by the mock flow

### Requirement: Recovered structure snapshot
The review session state SHALL persist a recovered-structure snapshot alongside task progress state.

#### Scenario: Task is reopened mid-recovery
- **WHEN** the user refreshes during structure recovery
- **THEN** the session state restores the recovered paragraphs, active section, and current recovery stage

#### Scenario: Task enters review preparation after OCR hydration
- **WHEN** OCR hydration stores recovered sections and paragraphs on the task aggregate
- **THEN** review-preparation stage snapshots use that recovered structure as their current paragraph and section source

### Requirement: Backend-replaceable structure state
The session state SHALL keep the recovered-structure contract compatible with a future backend implementation.

#### Scenario: Backend sends recovered structure
- **WHEN** a backend event delivers recovered paragraphs or section boundaries
- **THEN** the session state can hydrate the same structure snapshot used by the mock flow

### Requirement: Recovered issue anchor rebinding
The review session state SHALL reuse recovered structure to rebind compatible issue anchors before the workbench opens.

#### Scenario: OCR hydration completes
- **WHEN** the task receives a hydrated recovered structure
- **THEN** the session state can align existing issue anchors to recovered paragraphs before the workbench renders

#### Scenario: No recovered match exists
- **WHEN** an issue cannot be matched to a recovered paragraph
- **THEN** the session state preserves the original issue semantics and falls back to a safe paragraph anchor

### Requirement: OCR result hydration in session state
The review session service SHALL support hydrating recovered structure from a completed OCR result before review analysis begins.

#### Scenario: OCR job completes successfully
- **WHEN** the OCR job reaches `done` and a `resultUrl.jsonUrl` is available
- **THEN** the session state can store the hydrated recovered structure snapshot alongside the task aggregate

#### Scenario: OCR hydration fails
- **WHEN** OCR result hydration fails due to remote fetch or parse errors
- **THEN** the task remains visible with a non-secret failure message and can still fall back to the existing mock recovery path
