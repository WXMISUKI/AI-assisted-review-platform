## MODIFIED Requirements

### Requirement: Context-safe task isolation
The opening-condition portal SHALL isolate review data by selected hierarchical context.

#### Scenario: User changes workspace
- **WHEN** a user switches from one workspace to another
- **THEN** basis sets, master data, check tasks, evidence, and reports are loaded for the selected project/review-object/participating-entity context only

#### Scenario: Workspace selection shows bound assets
- **WHEN** a user is about to switch workspace context
- **THEN** the portal shows which basis, master-data readiness, knowledge-base readiness, and run-history facts belong to that workspace
- **AND** the operator can see that those assets are isolated from neighboring contexts before switching
