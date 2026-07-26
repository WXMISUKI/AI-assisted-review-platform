## ADDED Requirements

### Requirement: Selected task issue closure summary
The opening-condition task ledger SHALL show a compact issue-closure summary for the selected task using current run facts.

#### Scenario: Selected task has open issue work
- **WHEN** the selected task has failed, rejected, blocked, or unresolved human-review items
- **THEN** the selected-task handoff shows the open issue count, pending human-review count, rectification delivery count, and next action
- **AND** the summary does not mutate task, review, report, or archive state

#### Scenario: Selected task issue work is closed
- **WHEN** the selected task has no failed, rejected, blocked, or unresolved human-review items
- **THEN** the selected-task handoff indicates that issue closure is ready for report or archive handoff

### Requirement: Report page issue closure summary
The opening-condition report delivery workbench SHALL show the selected run's issue-closure summary near the report handoff context.

#### Scenario: Operator reviews report handoff
- **WHEN** the report delivery workbench renders a selected run
- **THEN** it shows whether issue handling is blocked, waiting for human judgement, ready for delivery, archived, or ready for rerun
- **AND** it shows the next action derived from the selected run's existing findings and human-review queue

### Requirement: Issue closure summary remains derived and read-only
The opening-condition portal SHALL treat issue-closure summaries as derived UI handoff data.

#### Scenario: Summary is displayed
- **WHEN** the issue-closure summary is displayed in the task ledger or report page
- **THEN** it is derived from report findings, human-review queue items, and rectification delivery rows
- **AND** it does not create new backend facts, provider calls, human-review decisions, or archive events
