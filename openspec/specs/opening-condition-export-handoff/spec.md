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
