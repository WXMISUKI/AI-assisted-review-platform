# document-review-task Specification Update

## ADDED Requirements

### Requirement: Document library lifecycle visibility
The system SHALL surface a human-readable lifecycle summary for each document task in the library and recent-history views.

#### Scenario: Task is in OCR processing
- **WHEN** a document task status is `parsing`
- **THEN** the library can display OCR progress, OCR job status, or the current OCR message

#### Scenario: Task is in review preparation
- **WHEN** a document task status is `reviewing`
- **THEN** the library can display the current pipeline stage and current paragraph or section context

#### Scenario: Task is ready or completed
- **WHEN** a document task status is `ready` or `completed`
- **THEN** the library can display a concise review-ready or completed summary without requiring the user to open the task first

#### Scenario: Task has failed
- **WHEN** a document task status is `failed`
- **THEN** the library can display the failure reason alongside the task entry

### Requirement: Library action gating
The system SHALL keep task entry actions aligned with the lifecycle state while preserving existing open, review, and result actions.

#### Scenario: OCR is still running
- **WHEN** a task is still processing OCR
- **THEN** the open action continues to lead to the locked OCR progress view

#### Scenario: Review preparation is running
- **WHEN** a task is in review preparation
- **THEN** the open action continues to lead to the locked streaming view

#### Scenario: Task is ready
- **WHEN** a task is ready for review
- **THEN** the open action leads to the review workbench
