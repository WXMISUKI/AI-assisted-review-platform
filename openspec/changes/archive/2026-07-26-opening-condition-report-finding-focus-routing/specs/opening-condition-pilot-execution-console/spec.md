## ADDED Requirements

### Requirement: Report finding checklist focus routing
The opening-condition report page SHALL allow operators to navigate from a report finding to the focused checklist detail for the same check item.

#### Scenario: Operator opens checklist context from a report finding
- **WHEN** the operator clicks a checklist-focus action on a report finding
- **THEN** the portal navigates to the checklist detail page
- **AND** the destination page indicates which checklist item is focused
- **AND** no report, task, or review decision data is changed

### Requirement: Report finding human-review focus routing
The opening-condition report page SHALL allow operators to navigate from a report finding to the focused human-review item when that finding still has an unresolved review item.

#### Scenario: Operator opens unresolved review context from a report finding
- **WHEN** the selected report finding has a matching open or deferred human-review item
- **AND** the operator clicks the human-review focus action
- **THEN** the portal navigates to the human-review page
- **AND** the matching review card is visually distinguished without submitting a decision

### Requirement: Report finding routing remains best-effort for read-only history
The opening-condition report page SHALL keep report-finding routing as transient navigation context even when the selected report run is historical.

#### Scenario: Operator views a historical report finding
- **WHEN** the selected report run is not the current mutable run
- **THEN** report finding actions remain read-only navigation aids
- **AND** the portal does not mutate the historical run or archive state
