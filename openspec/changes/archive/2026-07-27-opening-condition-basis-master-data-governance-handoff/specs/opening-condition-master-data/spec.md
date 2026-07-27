## MODIFIED Requirements

### Requirement: Current run master-data snapshot visibility
The opening-condition portal SHALL show which backend facts the current run is currently using in a dedicated snapshot separate from the full workspace catalog.

#### Scenario: Operator verifies current-run master-data facts
- **WHEN** the basis-and-master-data page opens for a selected pilot run
- **THEN** the page shows only the task-bound master-data ids as the current-run snapshot
- **AND** each fact includes type, lifecycle/confirmation state, usable-for-formal-match state, safe evidence summary, and next action where available
- **AND** a missing catalog record is shown as unresolved rather than replaced by an unrelated record

### Requirement: Current-run master-data binding explanation
The opening-condition portal SHALL explain which master-data records the current run can use for formal checks and distinguish preview candidates from reusable workspace facts.

#### Scenario: Current run has usable records
- **WHEN** the current run has `human_approved` or `published` master-data records in scope
- **THEN** the page shows them as the current-run usable snapshot with source, lifecycle label, and evidence summary
- **AND** the page does not label `human_approved` as a reusable workspace publication

#### Scenario: Current run has unresolved candidates
- **WHEN** the current run has provisional, low-confidence, rejected, expired, or missing required master-data records
- **THEN** the page shows the unresolved reason, missing fields or safe evidence note, and next action before formal checklist matching
