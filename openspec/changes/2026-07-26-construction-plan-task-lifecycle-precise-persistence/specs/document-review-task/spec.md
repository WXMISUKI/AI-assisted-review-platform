## MODIFIED Requirements

### Requirement: Backend reviewer action endpoints
The backend SHALL expose task-scoped review task lifecycle endpoints in addition to reviewer issue actions.

#### Scenario: Client deletes a persisted task
- **WHEN** the frontend deletes a persisted construction-plan review task
- **THEN** the backend supports a task-scoped delete endpoint
- **AND** the client does not need to replace the full task collection just to remove one task

### Requirement: Review task aggregate preservation
The document review task SHALL preserve key lifecycle checkpoints through the same task-scoped persistence contract.

#### Scenario: Lifecycle checkpoint is reached
- **WHEN** upload result hydration, OCR terminal state, preparation package persistence, generated issue merge, or generation terminal state is reached
- **THEN** the task can be upserted as a single backend snapshot
- **AND** later refresh can reopen from that stable checkpoint
