## MODIFIED Requirements

### Requirement: Pilot operational frontend contract
The system SHALL provide a typed frontend contract for workspace asset registry summaries in addition to pilot task and readiness operations.

#### Scenario: Backend workspace asset registry is displayed
- **WHEN** the opening-condition portal overview is rendered
- **THEN** the frontend can fetch backend-derived workspace asset registry summaries and display them without deriving the whole summary only from page-local mock packet data

#### Scenario: Workspace asset registry API fails
- **WHEN** the workspace asset registry API fails or returns a safe error payload
- **THEN** the frontend displays a bounded operational fallback and keeps the rest of the opening-condition portal usable

### Requirement: Current workspace task discovery contract
The pilot operational API SHALL expose sufficient workspace asset summary fields to explain the latest runnable run and archived history in overview surfaces.

#### Scenario: Overview resolves current workspace run
- **WHEN** the frontend renders the selected workspace asset summary
- **THEN** the contract includes latest task id, latest task state, archived count, active count, and current-run binding explanation sufficient for operator-facing overview rendering
