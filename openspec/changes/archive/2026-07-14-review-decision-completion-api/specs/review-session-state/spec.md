# review-session-state Delta

## ADDED Requirements

### Requirement: Backend decision actions are primary
The review session state SHALL use backend reviewer action APIs as the primary persistence path when available.

#### Scenario: Backend action succeeds
- **WHEN** an issue decision, draft edit, manual issue action, or completion action succeeds through the backend
- **THEN** the frontend session state updates from the returned task snapshot

#### Scenario: Backend action is unavailable
- **WHEN** a backend reviewer action fails due to connectivity or endpoint availability
- **THEN** the frontend preserves the existing local session-service mutation as a fallback without blocking MVP review

### Requirement: Completion uses backend task state
The review session state SHALL allow review completion to be derived from the persisted backend task snapshot.

#### Scenario: Backend completion returns a result asset
- **WHEN** the reviewer completes a task and the backend returns a result asset
- **THEN** the frontend navigates to the result view using the backend-updated task and result asset
