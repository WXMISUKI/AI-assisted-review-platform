## MODIFIED Requirements

### Requirement: Human-review blockers are displayed
The opening-condition execution console SHALL display task-owned human-review items with enough checklist context for a reviewer to identify the parent category, checklist name, target ID, current reason, and supporting evidence before choosing a decision.

#### Scenario: Human-review blockers exist
- **WHEN** the backend pilot task has open or deferred human-review items
- **THEN** the portal displays those task-owned items ahead of local demo review items, including category, optional subcategory, checklist name, target ID, reason, rule explanation, evidence references, and bounded decision actions

#### Scenario: Review item is not a checklist item
- **WHEN** a human-review item targets basis, master data, or report
- **THEN** the portal displays its target type, target ID, reason, and available evidence without inventing checklist context
