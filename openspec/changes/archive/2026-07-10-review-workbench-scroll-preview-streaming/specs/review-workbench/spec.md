## ADDED Requirements

### Requirement: Document-like processed preview
The review workbench SHALL display processed preview content as a document-like reading surface with readable paragraph spacing and bounded width.

#### Scenario: Preview is rendered
- **WHEN** processed paragraphs are displayed
- **THEN** the preview uses a centered document canvas, padding, section rhythm, and subtle separators instead of cramped full-width rows

### Requirement: Long preview containment
The review workbench SHALL contain long processed preview content inside a scrollable preview region.

#### Scenario: Preview content is long
- **WHEN** the processed preview contains more content than fits on screen
- **THEN** the preview region scrolls without forcing unrelated workbench panels to grow unexpectedly
