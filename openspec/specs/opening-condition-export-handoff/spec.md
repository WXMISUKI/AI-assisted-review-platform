# opening-condition-export-handoff Specification

## Purpose
Define a stable handoff contract for opening-condition original-form backfill and document export adapters so future docx/html services can consume platform-owned findings without owning business state.
## Requirements
### Requirement: Export-ready handoff contract
The opening-condition report package SHALL expose a stable handoff contract for original-form backfill and document export adapters.

#### Scenario: Exporter reads a report-ready run
- **WHEN** a platform or external exporter consumes a report-ready or archived opening-condition report asset
- **THEN** it can read bounded export-handoff fields including adapter identity, template identity, input object summary, findings summary, and next action without requiring provider raw output

### Requirement: Adapter-safe export summary
The export handoff SHALL remain safe for adapter consumption and operator display.

#### Scenario: Report package includes export handoff
- **WHEN** the platform returns export handoff fields
- **THEN** those fields exclude secrets, private URLs, raw prompts, and unbounded document text
- **AND** they preserve only the bounded facts required for future document conversion or original-form backfill

### Requirement: Deferred adapter execution
The export handoff capability SHALL support adapter registration before real adapter execution is enabled.

#### Scenario: Adapter is registered but not yet connected
- **WHEN** a report asset exposes a backfill or export adapter that is not yet wired to a live service
- **THEN** the handoff status remains visible as pending or draft
- **AND** the selected adapter, template, and next operator action are still inspectable

### Requirement: Export handoff stores adapter result
The opening-condition export handoff SHALL capture normalized document export results from the HTTP tools adapter.

#### Scenario: Report DOCX export succeeds
- **WHEN** a report export operation returns a `downloadUrl`
- **THEN** the task report asset exposes an updated export handoff with `exported` status, generated object summary, file key, file name, file size, and safe diagnostics

#### Scenario: Report DOCX export cannot run
- **WHEN** the adapter is not configured or the report asset is missing
- **THEN** the export handoff remains inspectable and the API returns a bounded failure status and next action

#### Scenario: Report DOCX export falls back to platform HTML semantics
- **WHEN** the adapter is not configured, unreachable, or the report asset is missing
- **THEN** the API returns a bounded failure status with `adapterStatus`, `fallback`, and `safeDiagnostics`
- **AND** the operator can still inspect the current export handoff and fall back to platform-owned HTML/page delivery semantics
### Requirement: Export handoff includes delivery package fields
The opening-condition export handoff SHALL identify the structured delivery package that downstream exporters or original-form backfill adapters should consume.

#### Scenario: Report package has delivery rows
- **WHEN** export handoff metadata is shown for a report-ready or archived run
- **THEN** it references delivery package readiness, row counts, blocking counts, adapter status, and the stable rectification rows as the source of document content

#### Scenario: Adapter execution is deferred
- **WHEN** no external adapter has executed yet
- **THEN** the handoff still exposes the delivery package summary and next action without requiring a live adapter call

### Requirement: Export handoff consumes stable delivery rows
The opening-condition export handoff SHALL treat delivery package rows as the stable source for report document content.

#### Scenario: Export adapter receives generated HTML
- **WHEN** the backend prepares report HTML for DOCX export
- **THEN** the generated HTML reflects the persisted delivery package rows when available
- **AND** it does not independently reinterpret raw provider output or unbounded document text

#### Scenario: Delivery package rows are already persisted
- **WHEN** the backend prepares export HTML for a report-ready or archived run
- **THEN** the generated HTML reflects the persisted delivery package row text before any findings-derived fallback
- **AND** successful export recording updates the handoff and delivery-package adapter status without recomputing raw provider output
