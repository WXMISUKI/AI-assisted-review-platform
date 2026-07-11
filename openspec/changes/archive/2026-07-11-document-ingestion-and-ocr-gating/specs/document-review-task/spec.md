## MODIFIED Requirements

### Requirement: Document upload and task creation
The system SHALL allow users to upload documents into the document library by drag-and-drop or file picker and create a review task entry linked to the stored source object when a file is selected, with OCR processing beginning before review workbench access is granted.

#### Scenario: User uploads document
- **WHEN** the user uploads a supported document file
- **THEN** the system stores the file through the backend object-storage endpoint, creates a document record with source object metadata, and marks the task as OCR processing before review can start

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

### Requirement: Uploaded document OCR submission state
The document review task SHALL store OCR job submission metadata and OCR progress for tasks created from stored source documents.

#### Scenario: OCR submission succeeds after upload
- **WHEN** a file upload succeeds and the backend accepts OCR submission for the stored object
- **THEN** the created document task stores the OCR job id, OCR progress state, and enters the `parsing` status

#### Scenario: OCR progress updates
- **WHEN** the backend OCR job reports pending or running progress
- **THEN** the document task stores the normalized progress data and the document library can show the progress percentage

#### Scenario: OCR submission fails after upload
- **WHEN** a file upload succeeds but OCR submission fails
- **THEN** the created document task stores the OCR failure message and enters the `failed` status

#### Scenario: Mock task is created
- **WHEN** a user creates a mock task without a stored source object
- **THEN** the created document task remains in `uploaded` status without OCR job metadata

### Requirement: OCR gate before review workbench
The system SHALL keep OCR-processing tasks locked from review actions until OCR completion is confirmed.

#### Scenario: User opens OCR-processing task
- **WHEN** the user opens a document whose OCR job is still pending or running
- **THEN** the system shows a locked OCR progress state instead of the review workbench

#### Scenario: OCR progress is shown
- **WHEN** a document is in OCR processing
- **THEN** the system displays a progress percentage and lets the user return to the library while processing continues in the background

#### Scenario: OCR completes
- **WHEN** the backend OCR job reports done
- **THEN** the task transitions out of OCR processing and becomes eligible for review agent preparation

### Requirement: Review detail handoff
The system SHALL open the review workbench only after OCR is complete and the review preparation stage is ready.

#### Scenario: Review task completes
- **WHEN** AI review issues have been generated
- **THEN** the detail page unlocks the review workbench for user actions

#### Scenario: User opens an in-progress task
- **WHEN** the user opens a document whose review is still loading
- **THEN** the system shows a locked loading state instead of the workbench

#### Scenario: OCR has not finished yet
- **WHEN** the user opens a document that is still OCR processing
- **THEN** the system keeps the workbench locked and does not start review interaction until OCR completes

### Requirement: Asynchronous review processing
The system SHALL process document parsing and AI review asynchronously after OCR completion, and SHALL continue processing even if the user leaves the page.

#### Scenario: User starts review
- **WHEN** the OCR job has completed and the user review task begins
- **THEN** the system enters a loading state while the backend continues processing even if the user leaves the page

#### Scenario: Review task runs in background
- **WHEN** the user exits the detail page during processing
- **THEN** the review task continues, its OCR and review state remain persisted, and it can be resumed later from the document library

#### Scenario: Review preprocessing starts
- **WHEN** OCR completes successfully
- **THEN** the system begins document normalization and review agent preparation before the workbench unlocks

### Requirement: Detail-context streaming progress
The document review task SHALL support showing AI processing progress from within the document detail context and SHALL separate OCR progress from review-agent progress.

#### Scenario: User opens an in-progress review task
- **WHEN** a document review task is parsing or reviewing
- **THEN** the system displays a detail-like processing page with outline, document, and issue panels in a locked streaming state

#### Scenario: AI issue arrives during processing
- **WHEN** a mock or backend streaming event provides a new issue
- **THEN** the issues panel can show the issue incrementally before the final ready state

#### Scenario: OCR progress is active
- **WHEN** a document is still in OCR processing
- **THEN** the detail-context page shows OCR progress instead of review-agent issue streaming

#### Scenario: Review agent progress is active
- **WHEN** OCR has completed and review preparation is underway
- **THEN** the detail-context page shows outline, document, and issue panels in a locked streaming state until the workbench is ready

### Requirement: Completed document result entry
The document library SHALL show a result entry for documents that have completed result assets.

#### Scenario: Completed document is listed
- **WHEN** a document has a generated result asset
- **THEN** the document library shows a view-result action instead of only review actions

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

### Requirement: Recent history filename containment
The document library SHALL constrain recent-history filenames within the sidebar and expose the full filename on hover.

#### Scenario: Long filename is listed
- **WHEN** a recent document has a long filename
- **THEN** the visible title is truncated within the history item and the full title is available through hover text

### Requirement: Staged file before document creation
The document library SHALL stage a selected or dropped file in the upload card before creating a document task.

#### Scenario: File is selected
- **WHEN** the user selects a file
- **THEN** the file is shown in the upload card as pending addition and is not added to history or the document table yet

#### Scenario: Staged file is removed
- **WHEN** the user removes the staged file
- **THEN** the upload card clears the staged file without creating a document task

#### Scenario: User confirms staged file
- **WHEN** the user clicks the add-document action while a file is staged
- **THEN** the system uploads the staged file, submits OCR, and creates the document task after the add action

#### Scenario: User creates a demo task
- **WHEN** the user clicks the add-document action without a staged file
- **THEN** the system creates a demo document task using the optional metadata fields

### Requirement: Document task deletion
The document library SHALL allow users to delete an existing document task after confirmation.

#### Scenario: User requests document deletion
- **WHEN** the user clicks delete on a document task
- **THEN** the system shows a confirmation dialog identifying the document

#### Scenario: User confirms document deletion
- **WHEN** the user confirms deletion
- **THEN** the system removes the document task from the library state and mock persistence

#### Scenario: User cancels document deletion
- **WHEN** the user cancels deletion
- **THEN** the document task remains unchanged
