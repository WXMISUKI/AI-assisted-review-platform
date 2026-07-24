## ADDED Requirements

### Requirement: Document adapter boundary
The opening-condition bridge SHALL treat original-form backfill and document export adapters as optional integration points rather than owners of platform review state.

#### Scenario: Platform prepares original-form backfill
- **WHEN** a report-ready opening-condition run needs original-form backfill or document export
- **THEN** the platform prepares a bounded export handoff package first
- **AND** any Dify or external adapter consumes that handoff package without becoming the durable owner of findings, human decisions, or archive state

### Requirement: Adapter result normalization
The bridge SHALL normalize document-adapter results into platform-safe summaries.

#### Scenario: External adapter returns a conversion or backfill result
- **WHEN** a Dify workflow or document adapter returns output metadata
- **THEN** the platform stores only bounded adapter status, template identity, generated object references, and safe diagnostics

