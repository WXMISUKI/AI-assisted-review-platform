## ADDED Requirements

### Requirement: Manual execution console contract
The system SHALL provide a portal-facing manual execution contract for opening-condition pilot task refresh, intake/init, and formal matching.

#### Scenario: Portal shows explicit execution actions
- **WHEN** a user opens the opening-condition review page
- **THEN** the frontend can refresh task state, initialize intake, and trigger formal matching through explicit controls instead of implicit workspace-side effects

#### Scenario: Portal renders backend task execution state
- **WHEN** a pilot task exists
- **THEN** the frontend uses backend task state, readiness, check items, evidence, human-review queue, and report state as the preferred execution view
