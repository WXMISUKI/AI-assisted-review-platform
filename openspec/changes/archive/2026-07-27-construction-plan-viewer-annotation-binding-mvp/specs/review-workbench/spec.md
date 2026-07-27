## ADDED Requirements

### Requirement: Viewer-first DOCX review detail
The construction-plan review workbench SHALL use the source-faithful DOCX viewer as the primary document-reading surface for ready `.docx` tasks.

#### Scenario: Ready DOCX task opens
- **WHEN** the workbench opens for a task with a previewable `.docx` source object
- **THEN** the viewer is shown as the main detail reading surface and issue handling remains available alongside it

#### Scenario: Previewable source is unavailable
- **WHEN** the task has no previewable `.docx` source object or preview loading fails
- **THEN** the workbench can fall back to the existing paragraph-based document surface without blocking review actions

### Requirement: Paragraph surface is secondary for viewer-first tasks
The workbench SHALL demote the old paragraph-rendered document surface for viewer-first tasks.

#### Scenario: Viewer is available
- **WHEN** the source-faithful viewer is ready
- **THEN** the paragraph-rendered document surface is presented only as a secondary fallback or debug aid rather than the primary operator surface

### Requirement: Viewer-focused issue landing
The review workbench SHALL land the active issue in a visible matched region inside the source-faithful viewer.

#### Scenario: User focuses an issue
- **WHEN** the user clicks an issue card or otherwise changes the active issue
- **THEN** the viewer scrolls to the best matched rendered block and applies a visible highlight state

#### Scenario: Viewer match is not exact
- **WHEN** the viewer cannot recover an exact match for the issue
- **THEN** it still uses the best available fallback term and does not block issue review

### Requirement: Viewer-side manual annotation
The review workbench SHALL allow manual issue creation from text selected directly inside the source-faithful viewer.

#### Scenario: User selects text in the viewer
- **WHEN** the user selects valid text inside the rendered viewer DOM
- **THEN** the workbench captures a manual annotation draft without requiring the old paragraph surface

#### Scenario: User submits a viewer-side annotation
- **WHEN** the user submits the manual annotation form from a viewer selection
- **THEN** the workbench adds a pending manual issue and keeps the existing issue decision workflow unchanged

### Requirement: Cover and TOC interference is reduced
The review workbench SHALL reduce user-visible interference from cover and table-of-contents paragraph artifacts in the primary viewer-first detail flow.

#### Scenario: Viewer-first review is active
- **WHEN** the task includes recovered `cover` or `toc` paragraph blocks
- **THEN** those blocks do not dominate the primary detail review reading experience
