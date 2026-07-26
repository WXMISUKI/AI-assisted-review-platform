## ADDED Requirements

### Requirement: Selected task detail handoff
The opening-condition task workbench SHALL show a selected-task detail handoff for the task row currently being inspected.

#### Scenario: Operator opens a workbench with tasks
- **WHEN** the workbench has one or more task rows
- **THEN** the newest or current task is selected by default
- **AND** the detail handoff shows the selected task's stage progress, current owner, next action, issue counts, human-review count, report status, and read-only state

#### Scenario: Operator selects another task row
- **WHEN** the operator selects a different task row
- **THEN** the detail handoff updates to that selected task
- **AND** historical archived tasks remain marked as read-only

### Requirement: Selected task action routing
The opening-condition selected-task detail handoff SHALL provide clear action routing for the selected task.

#### Scenario: Operator continues the next action
- **WHEN** the operator clicks the detail handoff's primary action
- **THEN** the portal navigates to the selected task's recommended execution page

#### Scenario: Report or archive is relevant
- **WHEN** the selected task has a report-ready, report-generated, or archived state
- **THEN** the detail handoff provides a report/archive action that routes to the reports page
