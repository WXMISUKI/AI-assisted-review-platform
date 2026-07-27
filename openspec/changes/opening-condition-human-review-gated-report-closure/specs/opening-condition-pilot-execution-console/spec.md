## MODIFIED Requirements

### Requirement: Checklist workbench shows task-backed status and in-place review
The selected task detail SHALL render all extracted material-review checklist items and close review decisions inside the same workbench.

#### Scenario: Operator decides a review item in place
- **WHEN** the operator confirms, corrects, rejects, or defers a checklist-linked human-review item from the task workbench
- **THEN** the UI sends that decision through the existing backend review API
- **AND** it refreshes the selected task state
- **AND** it keeps the operator inside the same selected-task workbench instead of forcing a route change

#### Scenario: Review detail has evidence preview context
- **WHEN** the operator opens a checklist item row
- **THEN** the workbench switches into a review-detail mode
- **AND** the left side shows the related source preview or evidence context
- **AND** the right side shows AI review context plus bounded operator actions with clear button styling

### Requirement: Human-review completion stays inside the selected-task workbench
The selected task detail SHALL expose the existing human-review completion step without forcing the operator into a separate page.

#### Scenario: All blocking review items are closed
- **WHEN** the selected task has no open or deferred human-review items
- **THEN** the workbench enables the existing completion action
- **AND** completing that action continues the platform workflow into final report generation for the same selected task

#### Scenario: Completion or report step fails
- **WHEN** completion succeeds but report generation fails, or completion itself fails
- **THEN** the workbench shows a bounded stage-specific error message
- **AND** it keeps the selected task context intact for retry

### Requirement: Progress pane behaves like an agent timeline
The selected task progress pane SHALL show platform workflow events as a dynamic timeline.

#### Scenario: Automatic workflow events exist
- **WHEN** the task records extraction, inventory, matching, or report events
- **THEN** the pane renders those events in sequence with completed/current/waiting treatment
- **AND** it treats those stages as automatic agent work

#### Scenario: Human review is the active step
- **WHEN** the task is `awaiting_human_review`
- **THEN** the pane presents the human-review step as the only operator-required pause
- **AND** all other workflow steps remain represented as automatic agent work

### Requirement: Task history supports immediate creation and deletion
The opening-condition task history SHALL update when a task is created or deleted.

#### Scenario: Upload creates a task
- **WHEN** the upload flow returns a backend task
- **THEN** the history list immediately includes that task
- **AND** the detail view is bound to that returned task id
- **AND** the operator can still return to the centered new-review home without losing the workspace context

#### Scenario: Operator deletes a history task
- **WHEN** the operator clicks delete on a history row
- **THEN** the platform removes that task from opening-condition history
- **AND** the UI clears the selected detail if it was showing the deleted task
- **AND** the workbench falls back to the new-review home or the next available task instead of leaving a broken detail shell
