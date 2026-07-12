# review-session-state Specification Update

## ADDED Requirements

### Requirement: Shared review task lifecycle summary
The system SHALL expose a shared lifecycle summary contract for review tasks so the app shell and library pages can present consistent human-readable status text.

#### Scenario: Task is in OCR processing
- **WHEN** a task has OCR progress or OCR status metadata
- **THEN** the shared lifecycle summary can surface a concise OCR label and detail string

#### Scenario: Task is in review preparation
- **WHEN** a task is in the review-preparation pipeline
- **THEN** the shared lifecycle summary can surface the current stage, paragraph or section context, and stage position

#### Scenario: Task is ready, completed, or failed
- **WHEN** a task reaches ready, completed, or failed state
- **THEN** the shared lifecycle summary can provide a stable human-readable description for the library and detail surfaces

### Requirement: Shared task summary reuse
The system SHALL allow shell pages to reuse the same lifecycle summary contract instead of re-deriving status wording locally.

#### Scenario: Library row renders
- **WHEN** the document library renders a task row or history item
- **THEN** it can consume the shared summary contract directly

#### Scenario: Loading page renders
- **WHEN** the detail loading page renders a task
- **THEN** it can consume the same shared summary contract for stage and progress display
