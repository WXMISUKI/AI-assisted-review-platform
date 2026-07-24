## ADDED Requirements

### Requirement: Export-handoff visibility in report delivery
The opening-condition report delivery view SHALL expose export-handoff readiness as part of the operator-facing delivery summary.

#### Scenario: Report package includes export handoff
- **WHEN** a selected run has exporter-ready handoff metadata
- **THEN** the report page shows the selected adapter or template, current handoff status, and the next action for original-form backfill or document export

