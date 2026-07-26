## MODIFIED Requirements

### Requirement: Save remains compatible with synchronous session service flows
The review session state SHALL keep existing synchronous session service operations usable while backend persistence is introduced.

#### Scenario: Task state is saved
- **WHEN** a session service operation mutates task state
- **THEN** local state updates immediately
- **AND** backend synchronization is selected explicitly by the caller instead of always executing a bulk snapshot sync

#### Scenario: Optimistic local mutation occurs
- **WHEN** a reviewer action already has a dedicated backend persistence endpoint
- **THEN** the local session-service mutation can remain cache-only
- **AND** the returned backend task snapshot remains the authoritative reconciliation source

### Requirement: Backend-owned review task snapshots
The review session state SHALL support loading and saving review task snapshots through a backend persistence contract.

#### Scenario: New task is created
- **WHEN** the frontend creates a new construction-plan review task
- **THEN** the task is persisted to the backend through a task-scoped upsert endpoint
- **AND** localStorage only acts as immediate cache

#### Scenario: Task is deleted
- **WHEN** the frontend deletes a construction-plan review task
- **THEN** the repository can perform an explicit backend replace sync for the remaining task set
- **AND** deletion does not require every unrelated hot-path mutation to use bulk sync
