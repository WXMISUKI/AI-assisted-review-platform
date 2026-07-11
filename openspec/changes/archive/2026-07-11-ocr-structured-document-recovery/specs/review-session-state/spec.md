## ADDED Requirements

### Requirement: Recovered structure snapshot
The review session state SHALL persist a recovered-structure snapshot alongside task progress state.

#### Scenario: Task is reopened mid-recovery
- **WHEN** the user refreshes during structure recovery
- **THEN** the session state restores the recovered paragraphs, active section, and current recovery stage

### Requirement: Backend-replaceable structure state
The session state SHALL keep the recovered-structure contract compatible with a future backend implementation.

#### Scenario: Backend sends recovered structure
- **WHEN** a backend event delivers recovered paragraphs or section boundaries
- **THEN** the session state can hydrate the same structure snapshot used by the mock flow
