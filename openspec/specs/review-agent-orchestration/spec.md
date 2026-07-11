# review-agent-orchestration Specification

## Purpose
TBD - created by archiving change review-orchestration-streaming-progress. Update Purpose after archive.
## Requirements
### Requirement: Post-OCR review pipeline
The system SHALL represent review work after OCR as a staged pipeline that separates structure restoration, basis binding, review analysis, issue structuring, and result packaging.

#### Scenario: OCR completes and review preparation starts
- **WHEN** a document finishes OCR processing
- **THEN** the system enters a review-preparation pipeline instead of jumping directly to a ready review state

#### Scenario: Pipeline stage is visible
- **WHEN** a document is being prepared for review
- **THEN** the system can expose the current pipeline stage id, stage title, and stage progress to the detail context

### Requirement: Paragraph-level streaming progress
The system SHALL expose review progress at paragraph or section granularity while the pipeline is preparing the document for review.

#### Scenario: A paragraph is being processed
- **WHEN** the review pipeline is processing content
- **THEN** the system can report the current paragraph or section being processed together with the total scope being handled

#### Scenario: Streaming progress updates incrementally
- **WHEN** the review pipeline advances
- **THEN** the system can update outline context, document snippets, and issue summaries without waiting for the entire document to finish

### Requirement: Locked detail observation
The system SHALL allow a user to open an in-progress document and observe live pipeline progress while keeping review actions locked until the pipeline is ready.

#### Scenario: User opens an in-progress task
- **WHEN** a document is still in review preparation
- **THEN** the detail page shows the locked streaming state instead of the editable review workbench

#### Scenario: Pipeline becomes ready
- **WHEN** the pipeline finishes normalization and issue generation
- **THEN** the detail page can unlock the review workbench for user actions

### Requirement: Agent role boundaries
The system SHALL reserve explicit agent roles for document structure restoration, construction plan review, and review result packaging.

#### Scenario: Agent inventory is exposed
- **WHEN** the data assets page or orchestration layer lists agents
- **THEN** the system can show a structure-restoration agent, a construction plan review agent, and a review report generation agent as distinct roles

#### Scenario: Prompt binding is configured
- **WHEN** an authorized user configures an agent role
- **THEN** the system can associate that role with a dedicated prompt asset and schema version

### Requirement: Structure-restoration stage
The review pipeline SHALL include a structure-restoration stage that consumes OCR output before review analysis begins.

#### Scenario: OCR completes
- **WHEN** a document finishes OCR processing
- **THEN** the pipeline enters structure restoration before basis binding and review analysis

#### Scenario: Structure restoration is running
- **WHEN** the structure-restoration agent is active
- **THEN** the system can report the current paragraph or section being normalized and the progress of that recovery step

### Requirement: Hydrated structure visibility during review preparation
The system SHALL surface the recovered document structure in the review-preparation context once OCR hydration has produced sections and paragraphs.

#### Scenario: Recovered structure is available
- **WHEN** a task has a hydrated recovered structure snapshot
- **THEN** the review-preparation view can display the source format, section count, paragraph count, and current section

#### Scenario: Recovered structure is reopened
- **WHEN** a user reopens an in-progress task that already has recovered structure
- **THEN** the detail context can restore the last known section and paragraph summary without recomputing OCR
