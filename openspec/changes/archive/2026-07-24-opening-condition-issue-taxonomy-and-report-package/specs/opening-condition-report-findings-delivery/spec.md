## ADDED Requirements

### Requirement: Structured issue-delivery package
The opening-condition report SHALL include a structured issue-delivery package in addition to summary diagnostics.

#### Scenario: Report is generated for a failed or mixed-result run
- **WHEN** a report-ready or archived run contains findings that are failed, blocked, warning, rejected, or manually corrected
- **THEN** the report asset includes a structured findings package with issue type, checklist context, risk level, legal basis, rectification requirement, and latest human-review conclusion when available

### Requirement: Issue-type oriented report grouping
The report SHALL support grouping and summarizing findings by issue taxonomy and delivery priority.

#### Scenario: Multiple problem classes exist in one run
- **WHEN** the selected run contains findings from different opening-condition problem classes
- **THEN** the report can show grouped summaries by issue type and delivery priority rather than one flat undifferentiated list

### Requirement: Export-ready finding semantics
The report package SHALL expose bounded export-ready fields for future original-form backfill and document generation.

#### Scenario: External exporter reads the report package
- **WHEN** a future exporter or original-form backfill worker consumes the report asset
- **THEN** it can read stable checklist context, issue type, legal basis, rectification requirement, handling conclusion, and reviewer note fields without needing provider raw output

