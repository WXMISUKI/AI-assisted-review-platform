## ADDED Requirements

### Requirement: Task-bound checklist definition
The system SHALL persist a normalized checklist definition on the opening-condition pilot task before or during formal execution.

#### Scenario: Intake stores checklist definition
- **WHEN** intake/init receives normalized checklist-definition items
- **THEN** the pilot task stores those items as task-owned execution inputs

#### Scenario: Formal match reuses stored checklist definition
- **WHEN** a formal match request omits checklist items and the pilot task already has a stored checklist definition
- **THEN** the backend executes deterministic matching from the stored task-owned checklist definition
