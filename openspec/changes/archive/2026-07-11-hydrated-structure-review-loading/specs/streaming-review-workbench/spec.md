## ADDED Requirements

### Requirement: Recovered structure summary in locked streaming view
The streaming review workbench SHALL display a compact summary of the hydrated recovered structure while the task is still locked.

#### Scenario: Task is preparing for review
- **WHEN** the task has recovered sections and paragraphs but is not yet unlocked
- **THEN** the streaming view can show the recovered section list and paragraph counts alongside the pipeline progress

#### Scenario: Current section is known
- **WHEN** the recovered structure includes a current section or paragraph id
- **THEN** the locked streaming view can surface that current location to help users understand what the system is processing
