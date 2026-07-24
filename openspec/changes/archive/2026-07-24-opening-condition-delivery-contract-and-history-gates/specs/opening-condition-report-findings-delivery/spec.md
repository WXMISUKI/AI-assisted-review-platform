## ADDED Requirements

### Requirement: Report delivery handoff contract
The opening-condition report SHALL expose a bounded delivery handoff that explains the selected run's delivery status, action owner, next action, recommended page, and read-only state.

#### Scenario: Current report-ready run is rendered
- **WHEN** a current opening-condition run has generated a report asset
- **THEN** the report package includes a delivery handoff derived from task-owned state, findings, human-review decisions, and archive status
- **AND** the report page displays that handoff without requiring the operator to inspect raw task events

#### Scenario: Archived run is rendered
- **WHEN** an archived opening-condition run is inspected as history
- **THEN** the report delivery handoff marks the run as read-only
- **AND** the next action explains that continued work must start through a new rectification rerun rather than mutating the archived run

#### Scenario: Report is blocked by human review
- **WHEN** report delivery facts are derived for a run with open or deferred human-review items
- **THEN** the handoff identifies human review as the current owner
- **AND** it includes the blocking count and the next action to close the review queue before report delivery
