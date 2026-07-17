## ADDED Requirements

### Requirement: Checklist-object derivation during intake
The system SHALL derive checklist-definition inputs during intake/init when explicit checklist-definition items are omitted.

#### Scenario: Explicit checklist definition remains allowed
- **WHEN** intake/init receives normalized checklist-definition items explicitly
- **THEN** the backend stores those items and records that checklist adaptation came from direct input

#### Scenario: Controlled template is used
- **WHEN** intake/init omits checklist-definition items and the checklist object matches a controlled template
- **THEN** the backend derives checklist-definition items from that template, stores them on the task, and reports the template resolution in intake diagnostics

#### Scenario: Existing task definition is reused
- **WHEN** intake/init omits checklist-definition items, no template is matched, and the existing task already has a checklist definition
- **THEN** the backend reuses the stored task definition and reports that fallback in intake diagnostics
