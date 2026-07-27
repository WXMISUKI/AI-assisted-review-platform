## MODIFIED Requirements

### Requirement: Controlled checklist-definition source resolution
The system SHALL resolve task-bound checklist-definition inputs from explicit request data, uploaded checklist content extraction, controlled checklist-object templates, or an existing task definition in that priority order.

#### Scenario: Request checklist definition wins
- **WHEN** intake/init provides explicit checklist-definition items
- **THEN** those normalized items become the task-owned checklist definition regardless of any uploaded checklist extraction result or recognized checklist object template

#### Scenario: Uploaded checklist content is parsed
- **WHEN** intake/init omits explicit checklist-definition items and the uploaded checklist object can be parsed into material-review rows
- **THEN** the task-owned checklist definition is derived from the uploaded checklist content
- **AND** rows belonging to `资料核查` are persisted as normalized checklist-definition items

#### Scenario: Uploaded checklist extraction fails and template fallback is recognized
- **WHEN** intake/init omits explicit checklist-definition items, uploaded checklist extraction returns no usable items, and the checklist filename matches a controlled template
- **THEN** the task-owned checklist definition is derived from the matched template as a bounded fallback

#### Scenario: No source is available
- **WHEN** neither explicit checklist-definition items, uploaded checklist extraction, a recognized checklist-object template, nor an existing task definition are available
- **THEN** the task stores an empty checklist definition and the backend returns a safe diagnostic indicating manual checklist-definition input is required before formal matching
