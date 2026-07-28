## MODIFIED Requirements

### Requirement: Human-review page shows review context
The system SHALL show enough bounded context for an operator to identify, decide, and immediately observe the updated status of each checklist review item.

#### Scenario: Operator reviews a checklist item
- **WHEN** the human-review page renders a backend review item targeting a checklist item
- **THEN** it shows category, subcategory when present, checklist name, target ID, status, reason, rule explanation, and evidence references when available

#### Scenario: Context cannot be resolved
- **WHEN** the review item has no stored or recoverable checklist context
- **THEN** the page still shows target ID and reason and indicates that the checklist snapshot is unavailable

#### Scenario: Operator submits a decision from checklist detail
- **WHEN** the operator confirms, corrects, defers, or rejects a checklist review item from the agent detail view
- **THEN** the platform records the decision against the active human-review item
- **AND** the current task detail, pending-review counts, and task list reflect the updated status without requiring a manual page refresh
