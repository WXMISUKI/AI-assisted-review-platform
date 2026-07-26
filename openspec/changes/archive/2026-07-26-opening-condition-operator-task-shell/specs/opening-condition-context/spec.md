## ADDED Requirements

### Requirement: Operator task shell navigation
The opening-condition workspace shell SHALL expose primary navigation entries based on operator goals rather than internal execution steps.

#### Scenario: Operator scans the opening-condition sidebar
- **WHEN** the opening-condition workspace shell is rendered
- **THEN** the primary sidebar shows task workbench, human review, report archive, and follow-up asset governance entries
- **AND** material intake and checklist matching are not shown as equal primary navigation entries

#### Scenario: Operator opens a secondary execution page
- **WHEN** the operator navigates from a task row into material intake or checklist matching
- **THEN** the page title still shows the correct secondary page label
- **AND** the primary sidebar remains focused on operator-level destinations
