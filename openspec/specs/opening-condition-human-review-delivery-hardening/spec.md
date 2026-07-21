# opening-condition-human-review-delivery-hardening Specification

## Purpose
Define the delivery handoff from formal matching through human-review decisions to report generation for the opening-condition real-sample pilot.

## Requirements
### Requirement: Human-review delivery handoff
The system SHALL make human-review blockers the explicit handoff between formal matching and report generation for the opening-condition pilot.

#### Scenario: Formal matching creates blockers
- **WHEN** formal matching produces open human-review items
- **THEN** the human-review page shows task-owned blocker counts and tells the operator that confirm, correct, or reject decisions are required before report generation

#### Scenario: Deferred item remains blocking
- **WHEN** the operator defers a human-review item
- **THEN** the item remains counted as blocking and report generation remains unavailable

#### Scenario: Closed blockers enable report readiness
- **WHEN** all open or deferred human-review items are closed by confirm, correct, or reject decisions
- **THEN** the task can advance to report-ready state and the report page can offer report generation

### Requirement: Report generation state gate
The system SHALL expose report generation only when the backend task is report-ready and no report asset already exists.

#### Scenario: Task is awaiting human review
- **WHEN** the task state is `awaiting_human_review`
- **THEN** the report page does not enable report generation even if local fallback data has no blockers

#### Scenario: Task is report ready
- **WHEN** the task state is `report_ready`, has no open or deferred human-review items, and has no report asset
- **THEN** the report page enables report generation
