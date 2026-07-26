## ADDED Requirements

### Requirement: Task Ledger Shows Rectification Closure Summary
The opening-condition task ledger SHALL show a compact rectification closure summary for a task when the platform can compare it with a previous archived run.

#### Scenario: Ledger row has previous archived comparison
- **WHEN** an opening-condition task row has a previous archived run available for comparison
- **THEN** the task ledger displays compact counts for resolved issues, still-open issues, newly introduced issues, and items needing human judgement

#### Scenario: Ledger row has no comparison baseline
- **WHEN** an opening-condition task row has no previous archived run available for comparison
- **THEN** the task ledger does not display misleading zero-count closure comparison content for that row

### Requirement: Selected Task Handoff Shows Rectification Closure Summary
The opening-condition selected-task handoff area SHALL show the selected task's compact rectification closure summary when comparison data exists.

#### Scenario: Selected task has closure comparison
- **WHEN** the operator selects an opening-condition task that can be compared with a previous archived run
- **THEN** the handoff area displays resolved, still-open, new, and needs-human-judgement counts derived from the same facts as the report page

#### Scenario: Selected task has no closure comparison
- **WHEN** the selected task has no previous archived run comparison
- **THEN** the handoff area omits the closure summary and keeps the normal task next-action guidance visible
