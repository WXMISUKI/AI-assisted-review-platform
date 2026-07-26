## ADDED Requirements

### Requirement: Report export delivery package summary
The opening-condition report page SHALL show a concise export delivery package summary before lower-level issue groups.

#### Scenario: Operator opens a generated report
- **WHEN** the selected run has report facts or derived findings
- **THEN** the report page shows package status, schema version, row count, blocking count, current adapter readiness, and next action
- **AND** the operator can understand whether the structured report facts are ready for DOCX export, original-form backfill, or specialist-agent handoff
