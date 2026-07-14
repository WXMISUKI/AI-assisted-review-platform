# document-review-task Specification

## Purpose
TBD - created by archiving change platform-framework-blueprint. Update Purpose after archive.
## Requirements
### Requirement: Backend review task list
The backend SHALL expose a review task list endpoint.

#### Scenario: Client lists review tasks
- **WHEN** the frontend requests persisted review tasks
- **THEN** the backend returns a schema-versioned list of review task snapshots

#### Scenario: No backend tasks exist
- **WHEN** the backend store is empty
- **THEN** the backend returns an empty list without forcing the frontend to discard local fallback tasks

### Requirement: Backend review task read
The backend SHALL expose a single review task read endpoint.

#### Scenario: Client reads a task
- **WHEN** the frontend requests a task by id
- **THEN** the backend returns the matching review task snapshot if it exists

#### Scenario: Task does not exist
- **WHEN** the requested task id is absent
- **THEN** the backend returns a safe not-found response without leaking storage details

### Requirement: Backend review task upsert
The backend SHALL allow the frontend to upsert review task snapshots.

#### Scenario: Client upserts one task
- **WHEN** the frontend sends a valid review task snapshot for a task id
- **THEN** the backend stores that snapshot and returns the saved task

#### Scenario: Client bulk-syncs tasks
- **WHEN** the frontend sends a bounded list of review task snapshots
- **THEN** the backend stores the list using the development persistence adapter and returns a safe summary

### Requirement: Persisted task snapshots remain safe
The backend SHALL reject or omit unsafe task persistence fields.

#### Scenario: Unsafe fields are present
- **WHEN** a task snapshot includes credentials, tokens, raw prompts, provider traces, or private object URLs
- **THEN** the backend does not persist those unsafe values

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

### Requirement: Library preview reduction
The document library SHALL not require a separate quick-preview pane before the user can enter review.

#### Scenario: User scans the library
- **WHEN** the document library is displayed
- **THEN** the primary actions focus on upload, open, continue, and report entry points

### Requirement: Detail-context streaming progress
The document review task SHALL support a detail-context progress view that can show the current stage, current paragraph or section, and issue summaries while the pipeline is preparing the document.

#### Scenario: User opens a task during review preparation
- **WHEN** the user opens a document whose review preparation is not finished
- **THEN** the system shows a locked detail page with stage-level and paragraph-level progress information

#### Scenario: Streaming events arrive during preparation
- **WHEN** the backend or mock pipeline emits a new progress update
- **THEN** the task can update its current stage, progress percentage, and visible snippet summaries without changing the task identity
- **THEN** the task transitions to failed state, preserves the failure message, and remains visible in the library

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

### Requirement: Immediate visible task after file selection
The document review task SHALL create a visible document entry immediately after a user selects or drops a file.

#### Scenario: File is selected
- **WHEN** the user selects a file from the upload control
- **THEN** the document appears in the recent history and document library while upload and OCR submission continue

#### Scenario: Upload or OCR submission fails
- **WHEN** storage upload or OCR submission fails after the entry is created
- **THEN** the document entry remains visible with failed status and a non-secret failure message

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

### Requirement: Review preparation stage visibility
The document review task SHALL expose a review-preparation stage after OCR completion and before the review workbench is unlocked.

#### Scenario: OCR finishes successfully
- **WHEN** a document OCR job reports completion
- **THEN** the task transitions into a review-preparation state that can be displayed in the detail context

#### Scenario: Review preparation is still running
- **WHEN** a document is still being normalized or analyzed for review
- **THEN** the task remains locked from editing actions while progress and stage information are visible

### Requirement: Detail-context streaming progress
The document review task SHALL support a detail-context progress view that can show the current stage, current paragraph or section, and issue summaries while the pipeline is preparing the document.

#### Scenario: User opens a task during review preparation
- **WHEN** the user opens a document whose review preparation is not finished
- **THEN** the system shows a locked detail page with stage-level and paragraph-level progress information

#### Scenario: Streaming events arrive during preparation
- **WHEN** the backend or mock pipeline emits a new progress update
- **THEN** the task can update its current stage, progress percentage, and visible snippet summaries without changing the task identity
- **THEN** the task transitions to failed state, preserves the failure message, and remains visible in the library

### Requirement: Recovered structure in task aggregate
The document review task SHALL store recovered document structure as part of the task aggregate and use it as the source of truth for review issue anchor rebinding and issue-draft generation after OCR hydration.

#### Scenario: Structure recovery succeeds
- **WHEN** OCR output is normalized into sections and paragraphs
- **THEN** the task stores the recovered structure together with the review task metadata and can use it to rebind issue anchors and generate structure-aware draft issues

#### Scenario: Recovered paragraphs are reopened
- **WHEN** a user opens a task that already has recovered structure
- **THEN** the detail page can render the recovered sections and paragraphs without recomputing OCR

### Requirement: Structure recovery stage visibility
The document review task SHALL expose a distinct structure-recovery stage between OCR completion and review preparation.

#### Scenario: Structure recovery is active
- **WHEN** OCR has completed but structure recovery is still running
- **THEN** the task remains locked while showing the active structure-recovery progress

### Requirement: Review task OCR result hydration
The document review task SHALL transition from OCR completion into structure hydration when PaddleOCR result content is available and use the hydrated structure to align issue anchors and issue drafts.

#### Scenario: OCR completion returns structured result
- **WHEN** the OCR job reaches `done` and returns a readable `resultUrl.jsonUrl`
- **THEN** the document task hydrates its recovered structure from the remote result before the workbench is unlocked and rebinds compatible issue anchors and draft issues

#### Scenario: OCR completion returns no usable result
- **WHEN** the OCR job reaches `done` but the result content cannot be fetched or parsed
- **THEN** the task keeps a clear failure or fallback state and does not silently fabricate recovered structure

### Requirement: Structure-aware loading stage source
The document review task SHALL expose structure-aware loading stage data to the loading view when recovered structure is present.

#### Scenario: Review preparation is underway
- **WHEN** the task is in review preparation with recovered structure available
- **THEN** the loading view can render stage-level progress from the same recovered structure that powers anchor rebinding and draft-issue summaries

#### Scenario: Recovered structure is absent
- **WHEN** the task has not yet produced recovered structure
- **THEN** the loading view continues to use the fallback stage templates already used for OCR and mock loading

### Requirement: Preparation package before workbench unlock
The document review task SHALL store a review-preparation package after OCR structure hydration and before opening the review workbench.

#### Scenario: OCR structure is hydrated
- **WHEN** OCR output is normalized into recovered sections and paragraphs
- **THEN** the task starts review preparation and stores the resulting package before the workbench becomes editable

#### Scenario: Preparation package is restored
- **WHEN** the user reopens a prepared task
- **THEN** the task can restore the package stage history and issue summaries from the task aggregate

### Requirement: Preparation fallback does not block review
The document review task SHALL keep a safe fallback path when backend package generation is unavailable.

#### Scenario: Backend preparation fails
- **WHEN** backend SSE cannot provide a package
- **THEN** the task stores a local fallback package and can continue to the existing workbench handoff using recovered structure and deterministic draft issues

#### Scenario: Recovered structure is absent
- **WHEN** no recovered structure is available
- **THEN** the task continues to use the existing mock or fallback loading behavior without fabricating a preparation package

### Requirement: Backend-generated reviewable task state
The document review task SHALL become reviewable from backend-owned materialized generation output.

#### Scenario: Generation output is materialized
- **WHEN** backend generation produces a reviewable preparation package
- **THEN** the persisted task transitions to ready status and can unlock the workbench from backend task state

#### Scenario: Generation is degraded but reviewable
- **WHEN** backend generation falls back or produces no candidates but still has a safe preparation package
- **THEN** the task remains reviewable with degraded diagnostics rather than becoming a failed document

### Requirement: Materialization preserves task ownership data
The document review task SHALL preserve existing document metadata and reviewer state when backend generation output is applied.

#### Scenario: Existing task has manual or reviewed issues
- **WHEN** backend materialization adds generated issue candidates
- **THEN** existing manual issues, reviewer decisions, OCR metadata, source object metadata, and result assets are preserved
