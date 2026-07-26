## ADDED Requirements

### Requirement: Selected task issue summary
The opening-condition task ledger SHALL show a compact issue summary for the selected task using existing task facts.

#### Scenario: Selected task has findings
- **WHEN** the selected task contains failed, blocked, rejected, warning, or needs-human-review findings
- **THEN** the selected-task detail shows prioritized issue rows with check item title, category, disposition, risk, evidence status, and a bounded reason
- **AND** the summary caps visible rows while keeping the full checklist and report pages as detail destinations

#### Scenario: Selected task has no findings
- **WHEN** the selected task has no reportable findings
- **THEN** the selected-task detail shows a safe empty state and keeps the recommended next action visible

### Requirement: Selected task pending human-review summary
The opening-condition task ledger SHALL distinguish unresolved human-review items from AI-detected issues.

#### Scenario: Human-review queue has open items
- **WHEN** the selected task has open or deferred human-review items
- **THEN** the selected-task detail shows the pending review count, representative review items, and a route to the human-review page

#### Scenario: Human-review queue is closed
- **WHEN** the selected task has no open or deferred human-review items
- **THEN** the selected-task detail indicates that no blocking human-review item remains

### Requirement: Selected task evidence and report handoff summary
The opening-condition task ledger SHALL expose evidence and report handoff readiness without duplicating the full report page.

#### Scenario: Evidence or report asset exists
- **WHEN** the selected task has matched evidence or a report asset
- **THEN** the selected-task detail shows evidence count, report status, MVP acceptance status when available, and a report/archive route when relevant
