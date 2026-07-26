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

### Requirement: Backend-persisted delivery package
The opening-condition backend SHALL generate and persist the report delivery package as part of report package diagnostics.

#### Scenario: Report is generated
- **WHEN** `POST /api/opening-condition/pilot-tasks/:taskId/report` succeeds
- **THEN** the returned report asset package diagnostics include a normalized delivery package with schema version, package id, task id, status, counts, rows, next action, and safe diagnostics
- **AND** the package excludes secrets, raw prompts, raw OCR text, private URLs, and unbounded provider output

#### Scenario: Archived report is inspected
- **WHEN** a report asset is archived
- **THEN** the delivery package is refreshed or preserved with read-only state and an archived handoff status

### Requirement: Delivery package normalization
The opening-condition store SHALL normalize delivery package payloads before persistence or response.

#### Scenario: Unsafe package fields are supplied
- **WHEN** a task snapshot includes delivery package fields with extra keys, excessive text, private URLs, or invalid statuses
- **THEN** the normalized task keeps only bounded delivery package fields and drops unsafe or unknown values

### Requirement: Export content consumes delivery package
The opening-condition report export content SHALL use the backend delivery package as the primary source for rectification rows.

#### Scenario: Delivery package rows exist
- **WHEN** report HTML or DOCX content is generated for a report asset that has `packageDiagnostics.deliveryPackage.rows`
- **THEN** the exported issue table is built from those rows
- **AND** each exported row includes checklist item, category, issue description, risk, disposition, basis, and rectification requirement from the delivery package

#### Scenario: Delivery package is absent
- **WHEN** report HTML or DOCX content is generated for an older report asset without `deliveryPackage`
- **THEN** the export falls back to structured findings without failing
