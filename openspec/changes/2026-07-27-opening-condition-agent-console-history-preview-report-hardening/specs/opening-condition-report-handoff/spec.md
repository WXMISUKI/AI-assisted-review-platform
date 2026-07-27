# opening-condition-report-handoff Delta

## ADDED Requirements

### Requirement: Platform report markdown follows the construction-condition delivery shape
The opening-condition report handoff SHALL keep a Markdown-first report body that matches the platform's construction-condition delivery format closely enough for operator review and downstream export reuse.

#### Scenario: Report markdown is generated
- **WHEN** the platform generates a report asset for an opening-condition pilot task
- **THEN** the Markdown includes the report title, verdict, project name, review object, declaration date, overall summary, statistics, nonconforming-item table, and rectification section
- **AND** the content is derived from task-owned review facts rather than frontend-invented conclusions

#### Scenario: Human-readable context is available
- **WHEN** project name or review-object context is available from normalized task fields or basis preview facts
- **THEN** the Markdown uses those human-readable values ahead of raw ids where possible
