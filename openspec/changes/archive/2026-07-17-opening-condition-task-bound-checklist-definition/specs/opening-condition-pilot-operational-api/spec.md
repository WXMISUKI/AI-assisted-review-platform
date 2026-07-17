## ADDED Requirements

### Requirement: Checklist-definition persistence contract
The system SHALL expose intake/init and formal-match contracts that support task-bound checklist-definition persistence.

#### Scenario: Frontend sends checklist definition once
- **WHEN** the portal initializes pilot intake from its current checklist adapter
- **THEN** the intake/init API accepts the normalized checklist-definition items and stores them on the task

#### Scenario: Match uses stored task definition
- **WHEN** the portal triggers formal matching after intake/init
- **THEN** the frontend may omit checklist items and rely on the task-owned checklist definition already persisted by the backend
