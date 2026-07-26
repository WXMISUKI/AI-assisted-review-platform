## ADDED Requirements

### Requirement: Export-ready report handoff fields
The opening-condition report handoff SHALL keep the fields needed for later DOCX or original-table export visible in the page-level delivery list.

#### Scenario: Operator reviews a delivery list row
- **WHEN** a finding row is rendered in the report delivery list
- **THEN** the row exposes the check item title, issue description, risk level, basis, rectification requirement, and available evidence or human-review notes

#### Scenario: Finding lacks enriched basis
- **WHEN** a finding does not yet have enriched legal-basis text
- **THEN** the row still shows the best available platform basis or a clear missing-basis placeholder
