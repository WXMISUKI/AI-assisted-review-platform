## ADDED Requirements

### Requirement: Trial bootstrap can continue matching asynchronously
The opening-condition pilot workflow SHALL support an operator-started bootstrap path where task intake and packet acceptance are committed before matching continues asynchronously.

#### Scenario: Task ledger receives an async bootstrap task
- **WHEN** a bootstrap request asks for asynchronous continuation
- **THEN** the workflow persists task creation, basis, master data, knowledge-base binding, packet intake, and safe events before responding
- **AND** later matching uses the same task id and existing platform-owned context

#### Scenario: Async continuation is not available
- **WHEN** the process restarts or the async continuation cannot run
- **THEN** the task remains visible in the ledger with its latest persisted state and can still be inspected or explicitly matched later
