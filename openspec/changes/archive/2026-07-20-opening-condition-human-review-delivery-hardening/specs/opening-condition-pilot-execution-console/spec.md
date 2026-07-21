## ADDED Requirements

### Requirement: Human-review delivery guidance
The opening-condition execution console SHALL show task-owned human-review progress and next action guidance after formal matching.

#### Scenario: Human-review blockers exist
- **WHEN** the backend pilot task has open or deferred human-review items
- **THEN** the console displays blocking count, closed count, task state, and guidance to close blockers before generating the report

#### Scenario: Human-review blockers are closed
- **WHEN** the backend pilot task has no open or deferred human-review items
- **THEN** the console displays that report generation is the next delivery action

### Requirement: Report action gating follows backend state
The report archive page SHALL require backend `report_ready` state before enabling report generation.

#### Scenario: Queue is empty but task is not report ready
- **WHEN** the human-review queue is empty but the backend task state is not `report_ready`
- **THEN** the report generation action remains disabled

#### Scenario: Report ready without existing report
- **WHEN** the backend task state is `report_ready` and no report asset exists
- **THEN** the report generation action is enabled
