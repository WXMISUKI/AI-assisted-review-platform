## ADDED Requirements

### Requirement: Human-review detail shows linked evidence summaries
The human-review detail page SHALL show bounded task-owned evidence summaries for the selected checklist-linked review item.

#### Scenario: Evidence records exist
- **WHEN** the selected review item has evidence ids linked to task evidence records
- **THEN** the detail page shows evidence file names, locator summaries, confidence, extracted values, and master-data references when available
- **AND** it does not expose private URLs, raw OCR text, or unbounded provider output

#### Scenario: No evidence records exist
- **WHEN** the selected review item has no linked evidence records
- **THEN** the detail page shows an explicit no-evidence state explaining that the operator must judge from checklist context and available preview fallbacks

### Requirement: Human-review detail explains actionability
The human-review detail page SHALL explain whether the selected checklist-linked item can still receive a human-review decision.

#### Scenario: Review item is open or deferred
- **WHEN** the selected item has an open or deferred human-review queue item
- **THEN** the decision pane states that an operator decision is required
- **AND** the decision actions remain available when the task is not busy

#### Scenario: Review item is already decided
- **WHEN** the selected item has a confirmed, corrected, or rejected ledger entry
- **THEN** the decision pane shows the existing ledger status and disables new decisions with an explanation
