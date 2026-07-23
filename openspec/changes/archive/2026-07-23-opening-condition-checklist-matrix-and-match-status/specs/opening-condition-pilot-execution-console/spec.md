## MODIFIED Requirements

### Requirement: Backend-backed execution result rendering
The opening-condition review page SHALL prefer backend pilot-task check items and evidence over local demo packet results whenever a pilot task exists.

#### Scenario: Backend check items are rendered as a checklist matrix
- **WHEN** the pilot task contains `checkItems` after formal matching
- **THEN** the review page renders each check item as a matrix row showing category, subcategory, checklist name, required flag, verdict, final disposition, matched evidence, mismatch reason, and linked human-review status

#### Scenario: Checklist definition is visible before formal matching
- **WHEN** the pilot task already has `checklistDefinition` but formal matching has not yet produced `checkItems`
- **THEN** the review page still renders a pending checklist matrix so the operator can see the full set of required review items before execution

#### Scenario: Human-review context is linked back to checklist rows
- **WHEN** a check item has linked human-review items
- **THEN** the matrix row shows the linked review status and reason so the operator can understand why the item is waiting for human confirmation
