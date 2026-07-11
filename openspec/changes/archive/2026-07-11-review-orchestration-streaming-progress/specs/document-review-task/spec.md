## ADDED Requirements

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
