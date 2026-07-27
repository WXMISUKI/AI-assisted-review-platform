## MODIFIED Requirements

### Requirement: Viewer-first DOCX review detail
The construction-plan review workbench SHALL use the source-faithful DOCX viewer and issue list as the primary detail-page review surface for ready `.docx` tasks.

#### Scenario: Ready DOCX task opens
- **WHEN** the workbench opens for a task with a previewable `.docx` source object
- **THEN** the page shows the source-faithful viewer beside the issue workflow without a paragraph fallback panel or heuristic chapter outline panel

#### Scenario: Previewable source is unavailable
- **WHEN** the task has no previewable `.docx` source object or preview loading fails
- **THEN** the issue workflow remains usable and the page does not require the removed paragraph fallback panel to render

### Requirement: Viewer selection does not restore stale issue focus
The review workbench SHALL keep a new viewer selection independent from the previously active issue until a new manual issue is created.

#### Scenario: User selects viewer text
- **WHEN** the user selects text in the source-faithful viewer
- **THEN** the workbench records section/paragraph context for the selection, clears stale active issue focus, and does not scroll to the previous issue

#### Scenario: User submits viewer annotation
- **WHEN** the user submits the manual annotation form
- **THEN** the newly created manual issue becomes active without automatically scrolling the page away from the selected viewer location

### Requirement: Internal recovered structure remains compatible
The review system SHALL retain recovered sections and paragraphs for review generation, issue anchors, persistence, and legacy task compatibility even though the detail UI no longer renders them as a chapter outline or paragraph fallback panel.

#### Scenario: Existing task is reopened
- **WHEN** an existing task contains recovered structure or paragraph anchors
- **THEN** the task remains loadable and issue actions remain available without requiring visible paragraph navigation UI
