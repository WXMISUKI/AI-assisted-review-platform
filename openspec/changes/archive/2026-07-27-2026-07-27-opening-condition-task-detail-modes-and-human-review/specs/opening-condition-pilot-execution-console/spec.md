## MODIFIED Requirements

### Requirement: Document library opens source previews
The selected task detail SHALL treat document preview as an explicit workbench mode instead of a default always-visible panel.

#### Scenario: DOCX file has storage key
- **WHEN** the operator selects a DOCX document-library file with a storage key
- **THEN** the UI loads a presigned URL and renders the document with the shared DOCX preview pattern

#### Scenario: File cannot be previewed inline
- **WHEN** the file is not DOCX or preview loading fails
- **THEN** the UI shows a bounded fallback with file metadata and an open/download action when a storage key is available

#### Scenario: Detail opens in list mode
- **WHEN** the operator selects a task from history
- **THEN** the detail shows collapsed `资料文档库` and `待核查资料项`
- **AND** it does not render the source preview shell until the operator clicks a file

#### Scenario: Operator previews a file
- **WHEN** the operator clicks a document-library file
- **THEN** the selected-task workbench switches into a dedicated preview view for that file
- **AND** the workbench shows loading feedback while the preview URL or renderer is resolving
- **AND** the operator can return to the task list surface without losing the selected task

### Requirement: Checklist workbench shows task-backed status and in-place review
The selected task detail SHALL render all extracted material-review checklist items and close review decisions inside the same workbench.

#### Scenario: Checklist items exist
- **WHEN** the backend task contains extracted checklist items
- **THEN** the task detail lists every material-review item
- **AND** each row shows a backend-backed status such as matched, unmatched, awaiting human review, or reviewed

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

### Requirement: Selected-task shell stays within parent layout bounds
The opening-condition task workbench SHALL keep sidebar rows, task detail columns, and preview/review panes inside their parent widths.

#### Scenario: Sidebar contains long titles
- **WHEN** navigation labels or historical task titles are longer than the available column width
- **THEN** the shell sidebar truncates or wraps them within the sidebar width
- **AND** no history row or nav button overflows horizontally

#### Scenario: Preview or review detail is open
- **WHEN** the selected-task workbench switches into preview or review mode
- **THEN** the pane layout respects the parent container width and height
- **AND** scrolling stays inside the intended pane instead of expanding the overall shell width
