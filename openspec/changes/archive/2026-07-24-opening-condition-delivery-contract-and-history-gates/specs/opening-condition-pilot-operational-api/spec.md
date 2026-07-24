## ADDED Requirements

### Requirement: Report package delivery handoff API field
The pilot operational API SHALL include bounded delivery handoff fields in report package diagnostics whenever a report asset is generated or archived.

#### Scenario: Report API generates diagnostics
- **WHEN** `POST /api/opening-condition/pilot-tasks/:taskId/report` succeeds
- **THEN** the returned report asset package diagnostics include delivery handoff fields for status, owner, next action, recommended page, read-only state, and blocking count
- **AND** those fields exclude secrets, raw prompts, raw OCR text, private URLs, and provider traces

#### Scenario: Archive API preserves diagnostics
- **WHEN** a task with a report asset is archived
- **THEN** the returned archived report asset preserves or refreshes delivery handoff fields so the archived report remains understandable as immutable history
