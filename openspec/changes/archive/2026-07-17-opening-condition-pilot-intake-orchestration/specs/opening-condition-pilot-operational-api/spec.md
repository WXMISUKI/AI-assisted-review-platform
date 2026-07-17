## ADDED Requirements

### Requirement: Operational intake/init contract
The system SHALL expose typed backend and frontend contracts for opening-condition pilot intake/init orchestration.

#### Scenario: Frontend initializes intake through one call
- **WHEN** the opening-condition portal needs to initialize a pilot task from object references
- **THEN** the frontend can call one typed intake/init API instead of composing generic task upsert, packet intake, and knowledge-base bind calls by itself

#### Scenario: Intake result explains orchestration outcome
- **WHEN** the intake/init API returns
- **THEN** the frontend receives task state, readiness, and bounded basis, master-data, and knowledge-base orchestration diagnostics suitable for operator display
