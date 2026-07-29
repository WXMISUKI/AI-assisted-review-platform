## ADDED Requirements

### Requirement: Focused review preview can follow content facts
The opening-condition execution console SHALL support switching the focused review preview based on the selected content-fact diagnostic.

#### Scenario: Operator selects a content-fact preview action
- **WHEN** the operator is in focused human-review mode and selects a content-fact preview action
- **THEN** the left preview pane switches to the linked material file
- **AND** the right decision pane remains in the same checklist review item

#### Scenario: Operator changes review context
- **WHEN** the operator opens a different checklist item or returns to list mode
- **THEN** any previous content-fact preview override is cleared
