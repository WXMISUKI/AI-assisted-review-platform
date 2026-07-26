## ADDED Requirements

### Requirement: Source-faithful DOCX preview
The review workbench SHALL show a near-source original-document preview for ready review tasks whose stored source object is a `.docx` file.

#### Scenario: Ready DOCX task opens
- **WHEN** the workbench opens for a task with stored `.docx` source metadata
- **THEN** the workbench can render a near-source original preview without replacing the existing issue workflow

#### Scenario: Task has no previewable source
- **WHEN** the task has no stored source object or the source file is not `.docx`
- **THEN** the workbench keeps the existing paragraph-based review surface without blocking issue handling

### Requirement: Issue-to-preview focus
The review workbench SHALL approximate the original location of the active issue inside the source-faithful preview.

#### Scenario: User focuses an issue
- **WHEN** the user clicks an issue card or otherwise changes the active issue
- **THEN** the preview scrolls to a likely matching block and shows a visible temporary focus highlight

#### Scenario: Matching text is unavailable
- **WHEN** the preview cannot find a matching block for the active issue anchor
- **THEN** the preview remains usable and does not block the current issue workflow
