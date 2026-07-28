## ADDED Requirements

### Requirement: History rows show circular progress
The opening-condition sidebar history SHALL show each task's progress as a compact circular indicator instead of plain percentage text.

#### Scenario: Task history renders
- **WHEN** a project has historical opening-condition tasks
- **THEN** each task row displays a circular progress indicator using the task progress value
- **AND** the task title remains constrained within the sidebar width

### Requirement: Agent timeline is localized
The selected task progress pane SHALL render workflow event labels and status text in Chinese.

#### Scenario: Workflow events render
- **WHEN** a selected task has platform workflow events
- **THEN** the timeline shows Chinese labels for task creation, intake, packet receipt, checklist extraction, material matching, human review, report generation, export, and archive
- **AND** step state labels are Chinese rather than English

### Requirement: Progress pane can collapse
The selected task detail SHALL allow the right-side agent progress pane to collapse and expand without losing the selected task.

#### Scenario: Operator collapses progress
- **WHEN** the selected task detail is in list mode
- **THEN** the operator can collapse the progress pane
- **AND** the file/checklist workbench expands within the parent detail area

### Requirement: Preview and review modes replace the whole detail workbench
The selected task detail SHALL render file preview and checklist review detail as full workbench modes rather than nested content inside the left pane.

#### Scenario: Operator opens a document
- **WHEN** the operator clicks a document-library file
- **THEN** the entire `opening-agent-detail` area switches to a file preview mode
- **AND** the preview has a larger bounded reading area and a return action

#### Scenario: Operator opens a checklist item
- **WHEN** the operator clicks a checklist-derived review item
- **THEN** the entire `opening-agent-detail` area switches to a review mode
- **AND** the review summary explains why human judgement is needed using current task facts
