## MODIFIED Requirements

### Requirement: Document upload and task creation
The system SHALL allow users to upload or drag documents into the document library and create a review task.

#### Scenario: User uploads document
- **WHEN** the user uploads a supported document
- **THEN** the system creates a document record and allows the user to start review

#### Scenario: User drops a file
- **WHEN** the user drags a file into the upload area
- **THEN** the system creates a corresponding mock review task entry

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
