## ADDED Requirements

### Requirement: Pilot readiness inspection route
The system SHALL expose a backend route for inspecting a pilot task readiness summary before formal checklist matching.

#### Scenario: Readiness route returns current gate status
- **WHEN** a user or frontend requests readiness for an existing pilot task
- **THEN** the system returns the task id, workspace id, current state, preflight readiness, and knowledge-base reference if present

#### Scenario: Readiness route handles missing task
- **WHEN** readiness is requested for an unknown pilot task
- **THEN** the system returns a not-found response without creating a task

### Requirement: Pilot task knowledge-base binding gate
The system SHALL allow a pilot task to bind a workspace-scoped subcontract-team knowledge base before formal material matching.

#### Scenario: Matching is attempted after binding ready knowledge base
- **WHEN** a pilot task has published basis, required master data, and a ready bound knowledge base
- **THEN** formal material matching can proceed after packet intake

#### Scenario: Binding references another workspace
- **WHEN** a knowledge-base binding request references a knowledge base outside the task workspace
- **THEN** the system rejects the binding as not found for that task context
