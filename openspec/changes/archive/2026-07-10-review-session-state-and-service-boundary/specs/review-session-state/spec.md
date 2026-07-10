## ADDED Requirements

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
