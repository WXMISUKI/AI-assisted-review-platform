## ADDED Requirements

### Requirement: Session-backed workbench loading
The review workbench SHALL load document paragraphs, issues, draft suggestions, and review mode from the review session service boundary.

#### Scenario: Workbench opens
- **WHEN** a ready review task is opened
- **THEN** the workbench displays paragraphs and issues loaded from the task's review session state

### Requirement: Session-backed issue resolution
The review workbench SHALL persist issue decisions through the review session service boundary.

#### Scenario: Issue decision changes
- **WHEN** a user accepts or rejects an issue
- **THEN** the updated issue status and resolution snapshot are stored in the task session state

#### Scenario: User returns to task
- **WHEN** a user leaves and reopens a task
- **THEN** previously resolved issue decisions are restored in the workbench
