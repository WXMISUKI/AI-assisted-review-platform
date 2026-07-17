## ADDED Requirements

### Requirement: Controlled checklist-object adaptation
The system SHALL support a controlled backend adaptation path from a pilot checklist object reference to a task-bound checklist definition.

#### Scenario: Recognized checklist object derives task-owned definition
- **WHEN** intake/init receives a recognized checklist object reference and no explicit checklist-definition items
- **THEN** the backend derives a normalized checklist definition from a controlled template and persists it on the pilot task

#### Scenario: Checklist object is not recognized
- **WHEN** intake/init cannot map the checklist object to a controlled template and the task has no existing checklist definition
- **THEN** the system returns a safe adapter diagnostic and formal matching remains blocked until a checklist definition is provided or derived
