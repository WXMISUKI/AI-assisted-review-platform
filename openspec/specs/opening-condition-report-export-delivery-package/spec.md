# opening-condition-report-export-delivery-package Specification

## Purpose
Define the bounded report delivery package that can be consumed by opening-condition DOCX export, original-form backfill adapters, and future specialist agents without scraping report-page copy.

## Requirements
### Requirement: Export delivery package
The opening-condition report SHALL expose a bounded delivery package that can be consumed by document exporters, original-form backfill adapters, and future specialist agents.

#### Scenario: Report has rectification rows
- **WHEN** a selected report run contains failed, rejected, blocked, warning, or pending-human-review findings
- **THEN** the system exposes a delivery package with schema version, package id, task id, read-only state, row counts, blocking counts, and structured rectification rows
- **AND** each row includes checklist context, issue description, risk, disposition, basis, rectification requirement, and bounded notes

#### Scenario: Report has no exportable rows
- **WHEN** a selected report run has no failed, rejected, blocked, warning, or pending-human-review findings
- **THEN** the package remains visible with an empty status and explains that there is no rectification row to hand off

### Requirement: Adapter-safe package boundary
The delivery package SHALL remain safe for adapter and agent consumption.

#### Scenario: Package is generated
- **WHEN** the report page derives the delivery package
- **THEN** the package excludes secrets, raw prompts, raw OCR text, private URLs, and unbounded provider output
- **AND** the package includes only bounded platform facts and short operator-facing notes

### Requirement: Handoff readiness summary
The delivery package SHALL expose readiness metadata that separates handoff readiness from report approval.

#### Scenario: Human review still blocks delivery
- **WHEN** unresolved or deferred human-review items remain
- **THEN** the package status indicates that human review blocks handoff and identifies the next action

#### Scenario: Rows are ready for downstream use
- **WHEN** the selected report has delivery rows and no unresolved human-review blocker
- **THEN** the package status indicates that it is ready for handoff and points downstream consumers to the stable rectification rows
