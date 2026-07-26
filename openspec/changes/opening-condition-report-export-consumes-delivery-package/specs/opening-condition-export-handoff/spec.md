## ADDED Requirements

### Requirement: Export handoff consumes stable delivery rows
The opening-condition export handoff SHALL treat delivery package rows as the stable source for report document content.

#### Scenario: Export adapter receives generated HTML
- **WHEN** the backend prepares report HTML for DOCX export
- **THEN** the generated HTML reflects the persisted delivery package rows when available
- **AND** it does not independently reinterpret raw provider output or unbounded document text
