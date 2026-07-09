## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Library preview reduction
The document library SHALL not require a separate quick-preview pane before the user can enter review.

#### Scenario: User scans the library
- **WHEN** the document library is displayed
- **THEN** the primary actions focus on upload, open, continue, and report entry points

#### Scenario: User opens detail
- **WHEN** the user wants to inspect document content
- **THEN** the system directs the user into the dedicated document detail work area
