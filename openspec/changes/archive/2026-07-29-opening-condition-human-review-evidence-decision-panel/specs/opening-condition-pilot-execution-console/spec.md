## ADDED Requirements

### Requirement: Review detail includes evidence and ledger panels
The opening-condition selected-task review detail SHALL include evidence summary and decision-ledger panels in the right-side decision area.

#### Scenario: Operator opens a checklist item
- **WHEN** the operator opens a checklist-derived review item
- **THEN** the right-side decision area shows reason text, linked evidence summaries, content-fact diagnostics, decision-ledger status, note input, and decision actions

#### Scenario: Item is not actionable
- **WHEN** the selected checklist item has no open or deferred human-review queue item
- **THEN** the decision actions are disabled
- **AND** the workbench explains that the item already has a conclusion or no pending backend review item
