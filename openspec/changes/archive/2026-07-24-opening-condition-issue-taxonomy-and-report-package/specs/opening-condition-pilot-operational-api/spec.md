## ADDED Requirements

### Requirement: Issue-taxonomy fields in pilot task payload
The pilot operational API SHALL expose structured issue-taxonomy fields on reportable opening-condition findings when available.

#### Scenario: Frontend fetches current task after matching
- **WHEN** a pilot task contains failed, blocked, warning, or needs-human-review findings
- **THEN** the task payload can include issue taxonomy id, issue label, risk level, legal basis, rectification requirement, and human conclusion fields for those findings

### Requirement: Structured report-package findings contract
The report-generation API SHALL return a structured findings package suitable for report rendering and future exporters.

#### Scenario: Report generation succeeds
- **WHEN** the frontend requests report generation for a pilot task
- **THEN** the response includes bounded structured findings and grouped delivery summaries in the report asset package diagnostics
- **AND** the contract remains safe for local rendering without exposing secrets, raw prompts, raw OCR text, or private object URLs

