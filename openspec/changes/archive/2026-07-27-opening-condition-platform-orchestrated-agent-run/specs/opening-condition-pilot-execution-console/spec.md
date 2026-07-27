## MODIFIED Requirements

### Requirement: Agent-style review console is the default opening-condition entry
The opening-condition portal SHALL present a single low-noise chat-style new-review entry before exposing task details or governance diagnostics.

#### Scenario: Operator opens the new-review home
- **WHEN** the operator enters the opening-condition platform with no selected task
- **THEN** the primary content shows `开工条件核查智能体`
- **AND** the chat-stage content is centered within the available shell content area without fixed-height clipping
- **AND** the brand mark remains visible at normal desktop viewport heights

### Requirement: Chat entry opens the existing three-material upload flow
The central chat-style entry SHALL open the existing upload modal instead of duplicating upload or task-creation logic.

#### Scenario: Upload succeeds
- **WHEN** the existing three-material upload flow returns a backend task
- **THEN** the left history list refreshes immediately for the selected project
- **AND** the returned task is selected for the detail view
- **AND** the UI does not require a manual browser refresh to show the task

### Requirement: Task detail separates files from review items
The selected opening-condition task detail SHALL distinguish source documents from checklist-derived review items.

#### Scenario: Operator opens a selected task
- **WHEN** the task detail renders
- **THEN** the left pane shows a collapsible `资料文档库` group containing uploaded basis, checklist, material package, and packet inventory files
- **AND** it shows a collapsible `待核查资料项` group containing checklist-derived review items
- **AND** review items show status labels such as `未匹配`, `已匹配`, and `待人工审核`

### Requirement: Progress pane follows platform run state
The selected opening-condition task progress pane SHALL render platform-owned run events, state, and report readiness.

#### Scenario: Platform run advances after upload
- **WHEN** the task has run events or progressed state after upload
- **THEN** the progress pane shows the current step and completed steps from those platform facts
- **AND** it does not remain stuck at `资料包已上传` when the platform has already produced checklist items or human-review status

### Requirement: Human review completion explicitly resumes report generation
The human-review page SHALL expose an explicit completion action after every blocking review item has an operator decision.

#### Scenario: Blocking items remain
- **WHEN** at least one human-review item is open or deferred
- **THEN** the completion action is disabled
- **AND** the page explains that report generation cannot continue until the item is handled

#### Scenario: Operator completes human review
- **WHEN** every flagged item has been confirmed, corrected, or rejected
- **THEN** the operator can submit `完成人工复核并生成报告`
- **AND** the UI calls the platform completion endpoint before generating the final report asset

### Requirement: No-task lookup avoids noisy fallback 404
The opening-condition UI SHALL avoid unnecessary task-detail fetches for the fallback workspace task id when no backend task exists.

#### Scenario: Selected workspace has no task
- **WHEN** the workspace task list is empty
- **THEN** the UI shows the first-review empty state
- **AND** it does not repeatedly request `GET /api/opening-condition/pilot-tasks/oc-pilot-<workspaceId>` as if that id were guaranteed to exist
