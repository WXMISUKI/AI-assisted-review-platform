## MODIFIED Requirements

### Requirement: Post-OCR review pipeline
The system SHALL represent review work after OCR as a staged pipeline that separates structure restoration, basis binding, review analysis, issue structuring, and result packaging.

#### Scenario: OCR completes and review preparation starts
- **WHEN** a document finishes OCR processing and recovered structure is available
- **THEN** the system enters a review-preparation pipeline driven by the recovered sections and paragraphs instead of fixed demo paragraph anchors

#### Scenario: Pipeline stage is visible
- **WHEN** a document is being prepared for review
- **THEN** the system can expose the current pipeline stage id, stage title, stage progress, current section, and current paragraph metadata to the detail context

### Requirement: Paragraph-level streaming progress
The system SHALL expose review progress at paragraph or section granularity while the pipeline is preparing the document for review.

#### Scenario: A recovered paragraph is being processed
- **WHEN** the review pipeline is processing OCR-hydrated content
- **THEN** the system reports the current recovered paragraph id, paragraph index, total paragraph count, and section label

#### Scenario: Streaming progress falls back safely
- **WHEN** no recovered OCR structure is available
- **THEN** the system continues to use the existing mock review-preparation stages without blocking the user
