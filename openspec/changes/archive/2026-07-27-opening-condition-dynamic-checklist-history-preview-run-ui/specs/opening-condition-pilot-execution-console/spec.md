## MODIFIED Requirements

### Requirement: Task history supports immediate creation and deletion
The opening-condition task history SHALL update when a task is created or deleted.

#### Scenario: Upload creates a task
- **WHEN** the upload flow returns a backend task
- **THEN** the history list immediately includes that task
- **AND** the detail view is bound to that returned task id

#### Scenario: Operator deletes a history task
- **WHEN** the operator clicks delete on a history row
- **THEN** the platform removes that task from opening-condition history
- **AND** the UI clears the selected detail if it was showing the deleted task

### Requirement: Document library opens source previews
The selected task detail SHALL let operators click document-library files to inspect previewable source files.

#### Scenario: DOCX file has storage key
- **WHEN** the operator selects a DOCX document-library file with a storage key
- **THEN** the UI loads a presigned URL and renders the document with the shared DOCX preview pattern

#### Scenario: File cannot be previewed inline
- **WHEN** the file is not DOCX or preview loading fails
- **THEN** the UI shows a bounded fallback with file metadata and an open/download action when a storage key is available

### Requirement: Detail groups default collapsed
The selected task detail SHALL keep `资料文档库` and `待核查资料项` collapsed by default.

#### Scenario: Operator opens task detail
- **WHEN** the task detail renders
- **THEN** both file and checklist groups are collapsed
- **AND** the operator can expand either group independently

### Requirement: Progress pane behaves like an agent timeline
The selected task progress pane SHALL show platform workflow events as a dynamic timeline.

#### Scenario: Automatic workflow events exist
- **WHEN** the task records extraction, inventory, matching, or report events
- **THEN** the pane renders those events in sequence with completed/current/waiting treatment

#### Scenario: Human review is the active step
- **WHEN** the task is `awaiting_human_review`
- **THEN** the pane presents the human-review step as the only operator-required pause
- **AND** all other workflow steps remain represented as automatic agent work
