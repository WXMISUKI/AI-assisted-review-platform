# document-review-task Specification

## Purpose
TBD - created by archiving change platform-framework-blueprint. Update Purpose after archive.
## Requirements
### Requirement: Document upload and task creation
The system SHALL allow users to upload documents into the document library by drag-and-drop or file picker and create a review task entry linked to the stored source object when a file is selected.

#### Scenario: User uploads document
- **WHEN** the user uploads a supported document file
- **THEN** the system stores the file through the backend object-storage endpoint, creates a document record with source object metadata, and allows the user to start review

#### Scenario: User drops a file
- **WHEN** the user drags a file into the upload area
- **THEN** the system uploads the file to object storage before creating the corresponding review task entry

#### Scenario: User selects a file
- **WHEN** the user clicks to choose a file from the upload control
- **THEN** the system uploads the selected file to object storage before creating the same document record flow as drag-and-drop upload

#### Scenario: User provides optional metadata
- **WHEN** the user leaves the file name or project name empty
- **THEN** the system uses the uploaded file name and a default project label instead of blocking upload

#### Scenario: Object upload fails
- **WHEN** the backend object-storage upload returns a failed result
- **THEN** the system shows the upload failure and does not create a document task for that file

#### Scenario: User creates a mock task without selecting a file
- **WHEN** the user clicks the manual upload action without selecting a file
- **THEN** the system may create a mock review task without source object metadata for prototype testing

### Requirement: Asynchronous review processing
The system SHALL process document parsing and AI review asynchronously after review starts.

#### Scenario: User starts review
- **WHEN** the user starts a review task
- **THEN** the system enters a loading state while the backend continues processing even if the user leaves the page

#### Scenario: Review task runs in background
- **WHEN** the user exits the detail page during processing
- **THEN** the review task continues and can be resumed later from the document library

### Requirement: Review detail handoff
The system SHALL open the review workbench only after AI issues are ready.

#### Scenario: Review task completes
- **WHEN** AI review issues have been generated
- **THEN** the detail page unlocks the review workbench for user actions

#### Scenario: User opens an in-progress task
- **WHEN** the user opens a document whose review is still loading
- **THEN** the system shows a locked loading state instead of the workbench

### Requirement: Library preview reduction
The document library SHALL not require a separate quick-preview pane before the user can enter review.

#### Scenario: User scans the library
- **WHEN** the document library is displayed
- **THEN** the primary actions focus on upload, open, continue, and report entry points

### Requirement: Detail-context streaming progress
The document review task SHALL support showing AI processing progress from within the document detail context.

#### Scenario: User opens an in-progress review task
- **WHEN** a document review task is parsing or reviewing
- **THEN** the system displays a detail-like processing page with outline, document, and issue panels in a locked streaming state

#### Scenario: AI issue arrives during processing
- **WHEN** a mock or backend streaming event provides a new issue
- **THEN** the issues panel can show the issue incrementally before the final ready state

### Requirement: Kernel-aligned review stages
The document review task SHALL expose stages that match the construction plan review kernel flow.

#### Scenario: Review task is processing
- **WHEN** the task is running
- **THEN** the task can report stages for document parsing, basis retrieval,危大/超危大 classification, rule matching, semantic review, issue structuring, and output generation

### Requirement: Hazard classification stage
The document review task SHALL reserve a stage for危大/超危大工程 classification before scenario-specific checks are finalized.

#### Scenario: Hazard classification completes
- **WHEN** the kernel determines the工程等级 from configured rules or mock data
- **THEN** the task stores the classification result and whether expert论证 checks are required

### Requirement: Basis trace status
The document review task SHALL indicate whether findings have traceable basis references.

#### Scenario: Issue structuring completes
- **WHEN** review issues are generated
- **THEN** the task can report counts for issues with complete basis references, partial basis references, and missing basis references

### Requirement: Completed document result entry
The document library SHALL show a result entry for documents that have completed result assets.

#### Scenario: Completed document is listed
- **WHEN** a document has a generated result asset
- **THEN** the document library shows a view-result action instead of only review actions

### Requirement: Result asset metadata
The document review task SHALL store mock result metadata with the document.

#### Scenario: Result is generated
- **WHEN** the review workbench completion payload is accepted
- **THEN** the document record stores result type, created time, mode, and issue statistics

### Requirement: Service-backed document library state
The document review task SHALL load and mutate document library records through the review session service boundary.

#### Scenario: Library loads documents
- **WHEN** the document library is displayed
- **THEN** the document list is read from the review session service rather than page-local seeded arrays

#### Scenario: Library creates document task
- **WHEN** a user uploads, drops, or manually adds a document
- **THEN** the new document task is created through the review session service and becomes visible in the library state

### Requirement: Refresh-resilient mock tasks
The document review task SHALL retain mock document tasks across page refreshes during MVP testing.

#### Scenario: User refreshes document library
- **WHEN** a user refreshes after creating or completing a document task
- **THEN** the document library restores the current task list and task result state from mock persistence

