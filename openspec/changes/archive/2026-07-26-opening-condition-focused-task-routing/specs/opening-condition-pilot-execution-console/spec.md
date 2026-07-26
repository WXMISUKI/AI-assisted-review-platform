## ADDED Requirements

### Requirement: Task detail issue focus routing
The opening-condition task ledger SHALL allow operators to navigate from a selected issue summary row to a focused checklist detail view.

#### Scenario: Operator opens a checklist issue from task detail
- **WHEN** the operator clicks an issue summary row action in the selected-task detail
- **THEN** the portal navigates to the checklist detail page
- **AND** the destination page indicates which checklist item is focused
- **AND** the matching checklist item row is visually distinguished without changing task data

### Requirement: Task detail human-review focus routing
The opening-condition task ledger SHALL allow operators to navigate from a selected pending-review row to a focused human-review view.

#### Scenario: Operator opens a pending review from task detail
- **WHEN** the operator clicks a pending human-review row action in the selected-task detail
- **THEN** the portal navigates to the human-review page
- **AND** the destination page indicates which review item is focused
- **AND** the matching review card is visually distinguished without submitting a decision

### Requirement: Focus context remains local and clearable
The opening-condition portal SHALL treat focused checklist and human-review ids as transient navigation context.

#### Scenario: Operator uses a different navigation route
- **WHEN** the operator navigates through a generic sidebar or task primary action rather than an item-level focus action
- **THEN** the portal clears stale focused item context
