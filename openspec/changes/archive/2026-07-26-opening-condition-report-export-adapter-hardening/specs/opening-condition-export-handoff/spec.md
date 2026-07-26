## MODIFIED Requirements

### Requirement: Export handoff stores adapter result
The opening-condition export handoff SHALL capture normalized document export results from the HTTP tools adapter.

#### Scenario: Report DOCX export cannot run
- **WHEN** the adapter is not configured, unreachable, or the report asset is missing
- **THEN** the API returns a bounded failure status with `adapterStatus`, `fallback`, and `safeDiagnostics`
- **AND** the operator can still inspect the current export handoff and fall back to platform-owned HTML/page delivery semantics

### Requirement: Export handoff consumes stable delivery rows
The opening-condition export handoff SHALL treat delivery package rows as the stable source for report document content.

#### Scenario: Delivery package rows are already persisted
- **WHEN** the backend prepares export HTML for a report-ready or archived run
- **THEN** the generated HTML reflects the persisted delivery package row text before any findings-derived fallback
- **AND** successful export recording updates the handoff and delivery-package adapter status without recomputing raw provider output
