# review-completion-results Delta

## ADDED Requirements

### Requirement: Backend-generated completion result
The system SHALL generate review completion result assets through the backend task completion action when the backend is available.

#### Scenario: Review mode completes through backend
- **WHEN** a review-mode task is completed through the backend
- **THEN** the backend creates and persists a supervisor report asset based on persisted issues and reviewer decisions

#### Scenario: Review-revise mode completes through backend
- **WHEN** a revise-mode task is completed through the backend
- **THEN** the backend creates and persists a revised-plan snapshot with processed paragraphs derived from accepted issue resolutions

### Requirement: Incomplete review cannot be completed
The system SHALL prevent backend completion while unresolved issues remain.

#### Scenario: Pending issue remains
- **WHEN** a task contains one or more pending issues
- **THEN** the backend completion endpoint returns a safe `incomplete_review` error and does not mark the task completed
