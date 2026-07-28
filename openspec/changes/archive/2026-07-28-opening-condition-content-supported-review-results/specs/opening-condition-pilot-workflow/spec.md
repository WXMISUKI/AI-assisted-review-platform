## ADDED Requirements

### Requirement: Material-review MVP excludes field-only checks
The opening-condition MVP SHALL exclude field-only checklist items from formal material-review matching unless they have explicit document evidence requirements.

#### Scenario: Checklist contains field-only items
- **WHEN** a checklist definition includes现场核查、现场检查、现场确认、应急响应、应急演练、应急处置 or现场观测 items
- **THEN** those items are marked out of scope or not applicable for the current material-review MVP
- **AND** they do not count as failed missing documents
