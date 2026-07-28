## ADDED Requirements

### Requirement: Review console displays content fact diagnostics
The opening-condition execution console SHALL display a compact content-verification diagnostics block in focused human-review mode.

#### Scenario: Focused review mode opens
- **WHEN** an operator opens a待核查资料项 detail
- **THEN** the right-side decision pane includes content-verification status chips and bounded diagnostic rows derived from the selected backend task
- **AND** the existing preview pane and decision buttons remain available

#### Scenario: Diagnostics are unavailable
- **WHEN** the selected item has no content-fact diagnostics
- **THEN** the console shows an empty-state message explaining that only filename or checklist-level evidence is available
