## ADDED Requirements

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
