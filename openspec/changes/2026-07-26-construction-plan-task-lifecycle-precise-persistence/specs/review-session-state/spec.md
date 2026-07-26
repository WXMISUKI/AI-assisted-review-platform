## MODIFIED Requirements

### Requirement: Save remains compatible with synchronous session service flows
The review session state SHALL keep existing synchronous session service operations usable while backend persistence is introduced.

#### Scenario: High-frequency UI state changes
- **WHEN** the user scrolls, changes active focus, or a loading stage advances without reaching a stable checkpoint
- **THEN** the frontend may keep that state in local cache only
- **AND** it does not need to upsert the task on every micro-transition

#### Scenario: Stable lifecycle checkpoint is reached
- **WHEN** the task reaches a stable lifecycle checkpoint needed for refresh recovery
- **THEN** the frontend performs a task-scoped backend upsert for that task
- **AND** localStorage remains the immediate fallback cache
