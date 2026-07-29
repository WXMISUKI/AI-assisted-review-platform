## ADDED Requirements

### Requirement: Content-fact diagnostics link to evidence preview
The human-review detail page SHALL allow operators to open the previewable evidence file associated with a content-fact diagnostic when such an asset exists.

#### Scenario: Content fact has previewable evidence
- **WHEN** a selected checklist item has a content fact that can be linked to a material file with a standalone preview asset
- **THEN** the diagnostic row exposes a preview action
- **AND** activating it updates the review detail preview pane to that file without leaving the human-review detail

#### Scenario: Content fact has no preview asset
- **WHEN** a content fact is manifest-only, unsupported, or cannot be linked to a previewable file
- **THEN** the diagnostic row remains visible
- **AND** it does not expose a misleading preview action
