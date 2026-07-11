## MODIFIED Requirements

### Requirement: Asynchronous review processing
The system SHALL process document parsing and AI review asynchronously after review starts, and SHALL keep the task synchronized with backend OCR job state while processing.

#### Scenario: User starts review
- **WHEN** the user starts a review task
- **THEN** the system enters a loading state while the backend continues processing even if the user leaves the page

#### Scenario: Review task runs in background
- **WHEN** the user exits the detail page during processing
- **THEN** the review task continues, its OCR status remains persisted, and it can be resumed later from the document library

#### Scenario: OCR job remains active
- **WHEN** a parsing task still has an unfinished OCR job
- **THEN** the system keeps polling the OCR job state and updates the task status without requiring manual refresh

### Requirement: Review detail handoff
The system SHALL open the review workbench only after AI issues are ready and the OCR-driven parsing state has completed.

#### Scenario: Review task completes
- **WHEN** AI review issues have been generated
- **THEN** the detail page unlocks the review workbench for user actions

#### Scenario: User opens an in-progress task
- **WHEN** the user opens a document whose review is still loading
- **THEN** the system shows a locked loading state instead of the workbench and waits for the OCR job to finish

#### Scenario: Task becomes ready after polling
- **WHEN** the OCR job transitions to done while the detail page is open
- **THEN** the task is refreshed to ready state and the workbench can be entered without re-uploading the document

### Requirement: Detail-context streaming progress
The document review task SHALL support showing AI processing progress from within the document detail context and SHALL keep that progress aligned with OCR job state.

#### Scenario: User opens an in-progress review task
- **WHEN** a document review task is parsing or reviewing
- **THEN** the system displays a detail-like processing page with outline, document, and issue panels in a locked streaming state

#### Scenario: AI issue arrives during processing
- **WHEN** a mock or backend streaming event provides a new issue
- **THEN** the issues panel can show the issue incrementally before the final ready state

#### Scenario: OCR progress updates
- **WHEN** the backend OCR job reports pending, running, done, or failed state
- **THEN** the detail page updates the visible processing stage, status badge, and issue panel lock state accordingly

## ADDED Requirements

### Requirement: OCR task status synchronization
The document review task SHALL synchronize parsing status with the backend OCR job state for stored document uploads.

#### Scenario: Parsing task is opened
- **WHEN** the user opens a document whose OCR job id exists and its state is still pending or running
- **THEN** the system polls the backend OCR job status and keeps the task in parsing state until the backend reports completion or failure

#### Scenario: OCR job completes
- **WHEN** the backend OCR job reports done
- **THEN** the task transitions to ready state and becomes available for review without requiring the user to create a new task

#### Scenario: OCR job fails
- **WHEN** the backend OCR job reports failed
- **THEN** the task transitions to failed state, preserves the failure message, and remains visible in the library
