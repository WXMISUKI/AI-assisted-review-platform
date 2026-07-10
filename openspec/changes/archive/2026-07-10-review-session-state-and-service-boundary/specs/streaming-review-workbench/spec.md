## ADDED Requirements

### Requirement: Session-backed streaming events
The streaming review workbench SHALL consume ordered review events from the review session service boundary.

#### Scenario: Streaming page opens
- **WHEN** a user starts or resumes a reviewing task
- **THEN** the streaming page renders the current ordered stage events from the task session state

#### Scenario: Streaming advances
- **WHEN** the mock stream advances to the next stage
- **THEN** the task session state records the current stage index so the review flow can resume consistently
