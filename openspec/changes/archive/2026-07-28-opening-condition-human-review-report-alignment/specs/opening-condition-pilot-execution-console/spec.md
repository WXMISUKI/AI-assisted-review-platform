## MODIFIED Requirements

### Requirement: Checklist workbench shows task-backed status and in-place review
The selected task detail SHALL render all extracted material-review checklist items and close review decisions inside the same workbench.

#### Scenario: Checklist items exist
- **WHEN** the backend task contains extracted checklist items
- **THEN** the task detail lists every current-MVP material-review item
- **AND** each row shows a backend-backed status such as matched, unmatched, awaiting human review, or reviewed
- **AND** out-of-scope rows such as `现场核查` are not shown as actionable `待核查资料项`

#### Scenario: Operator opens a checklist item
- **WHEN** the operator clicks a checklist item row
- **THEN** the workbench switches into a review-detail mode
- **AND** the left side shows the related source preview or evidence context
- **AND** the right side shows the AI review context plus bounded operator actions

#### Scenario: Operator decides a review item in place
- **WHEN** the operator confirms, corrects, rejects, or defers a checklist-linked human-review item from the task workbench
- **THEN** the UI sends that decision through the existing backend review API
- **AND** it refreshes the selected task state
- **AND** it returns to or updates the workbench with the new checklist-item status

### Requirement: Task history supports immediate creation and deletion
The opening-condition task history SHALL update when a task is created or deleted.

#### Scenario: Upload creates a task
- **WHEN** the upload flow returns a backend task
- **THEN** the history list immediately includes that task
- **AND** the detail view is bound to that returned task id

#### Scenario: Operator deletes a history task
- **WHEN** the operator clicks delete on a history row from the sidebar or report/history surface
- **THEN** the platform removes that task from opening-condition history
- **AND** the UI clears the selected detail if it was showing the deleted task
- **AND** visible copy uses delete/remove language instead of mixing deletion with hidden test-run semantics

### Requirement: Human-review completion stays inside the selected-task workbench
The selected task detail SHALL expose the existing human-review completion step without forcing the operator into a separate page.

#### Scenario: Blocking review items remain
- **WHEN** one or more human-review items are still open or deferred
- **THEN** the workbench keeps report completion disabled
- **AND** it explains that those items must be closed before final report generation

#### Scenario: All blocking review items are closed
- **WHEN** the selected task has no open or deferred human-review items
- **THEN** the workbench enables the existing completion action
- **AND** completing that action continues the platform workflow into final report generation
- **AND** report actions use final report delivery wording rather than report-summary-only wording
