## ADDED Requirements

### Requirement: Session-backed workbench entry
The review session state SHALL provide a normalized session snapshot to the review workbench when a task is opened.

#### Scenario: A task is opened for review
- **WHEN** the user opens a ready review task
- **THEN** the session service can provide the recovered paragraphs, rebounded issues, and current pipeline context used to initialize the workbench

#### Scenario: Session snapshot is unavailable
- **WHEN** the session snapshot cannot be derived
- **THEN** the workbench may fall back to the task aggregate and recovered structure without blocking entry
