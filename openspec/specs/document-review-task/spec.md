# document-review-task Specification

## Purpose
TBD - created by archiving change platform-framework-blueprint. Update Purpose after archive.
## Requirements
### Requirement: Document upload and task creation
The system SHALL allow users to upload documents into the document library by drag-and-drop or file picker and create a review task entry.

#### Scenario: User uploads document
- **WHEN** the user uploads a supported document
- **THEN** the system creates a document record and allows the user to start review

#### Scenario: User drops a file
- **WHEN** the user drags a file into the upload area
- **THEN** the system creates a corresponding mock review task entry

#### Scenario: User selects a file
- **WHEN** the user clicks to choose a file from the upload control
- **THEN** the system creates the same document record flow as drag-and-drop upload

#### Scenario: User provides optional metadata
- **WHEN** the user leaves the file name or project name empty
- **THEN** the system uses the uploaded file name and a default project label instead of blocking upload

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

