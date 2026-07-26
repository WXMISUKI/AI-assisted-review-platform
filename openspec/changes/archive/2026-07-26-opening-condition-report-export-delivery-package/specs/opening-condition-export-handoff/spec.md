## ADDED Requirements

### Requirement: Export handoff includes delivery package fields
The opening-condition export handoff SHALL identify the structured delivery package that downstream exporters or original-form backfill adapters should consume.

#### Scenario: Report package has delivery rows
- **WHEN** export handoff metadata is shown for a report-ready or archived run
- **THEN** it references delivery package readiness, row counts, blocking counts, adapter status, and the stable rectification rows as the source of document content

#### Scenario: Adapter execution is deferred
- **WHEN** no external adapter has executed yet
- **THEN** the handoff still exposes the delivery package summary and next action without requiring a live adapter call
