# opening-condition-pilot-checklist-definition Specification

## Purpose
Define how opening-condition pilot tasks persist normalized checklist definitions so formal matching can execute from backend-owned business inputs instead of frontend-only transient state.

## Requirements
### Requirement: Persisted checklist-definition field
The system SHALL persist a normalized checklist-definition field on each opening-condition pilot task.

#### Scenario: Task is normalized from storage
- **WHEN** a pilot task is read from or written to storage
- **THEN** its checklist-definition items are normalized, bounded, and safe for persistence

### Requirement: Match replay from task-owned checklist definition
The system SHALL support replayable formal matching from the task-owned checklist definition.

#### Scenario: Stored checklist definition exists
- **WHEN** a user reruns formal matching for a pilot task that already has a stored checklist definition
- **THEN** the backend can execute matching without requiring the frontend to resend the full checklist definition

#### Scenario: No checklist definition is available
- **WHEN** neither the request nor the task provides checklist-definition items
- **THEN** the backend rejects formal matching with a safe validation message

### Requirement: Controlled checklist-definition source resolution
The system SHALL resolve task-bound checklist-definition inputs from explicit request data, controlled checklist-object templates, or an existing task definition in that priority order.

#### Scenario: Request checklist definition wins
- **WHEN** intake/init provides explicit checklist-definition items
- **THEN** those normalized items become the task-owned checklist definition regardless of any recognized checklist object template

#### Scenario: Adapter derives checklist definition
- **WHEN** intake/init omits explicit checklist-definition items and the checklist object matches a controlled template
- **THEN** the task-owned checklist definition is derived from the matched template

#### Scenario: No source is available
- **WHEN** neither explicit checklist-definition items, a recognized checklist-object template, nor an existing task definition are available
- **THEN** the task stores an empty checklist definition and the backend returns a safe diagnostic indicating manual checklist-definition input is required before formal matching
