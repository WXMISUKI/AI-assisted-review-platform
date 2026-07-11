## ADDED Requirements

### Requirement: Review pipeline snapshot
The review session state SHALL preserve a pipeline snapshot alongside the existing task aggregate so the UI can restore post-OCR progress after refresh.

#### Scenario: Task is reopened mid-pipeline
- **WHEN** the user refreshes or reopens an in-progress document
- **THEN** the task state restores the current pipeline stage, progress, and paragraph context

#### Scenario: Pipeline state is mutated
- **WHEN** the review session service advances the pipeline
- **THEN** the updated snapshot remains replaceable by future backend APIs without changing page-level state assembly

### Requirement: Backend-replaceable streaming contract
The review session state SHALL remain compatible with a backend event stream that can carry stage, paragraph, and agent metadata.

#### Scenario: Backend event is mapped
- **WHEN** a backend progress event is received
- **THEN** the session state can map it into the same restored task snapshot used by the mock flow
