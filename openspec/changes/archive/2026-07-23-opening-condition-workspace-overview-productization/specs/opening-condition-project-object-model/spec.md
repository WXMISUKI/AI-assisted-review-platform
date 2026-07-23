## MODIFIED Requirements

### Requirement: Hierarchical opening-condition object model
The system SHALL represent opening-condition trial context with three explicit layers: project, review object, and participating entity.

#### Scenario: Workspace metadata is loaded
- **WHEN** the portal loads opening-condition workspace metadata
- **THEN** each selectable context SHALL identify its project, review object, and participating entity
- **AND** the portal SHALL be able to render those layers without relying on free-text parsing

#### Scenario: Current run context is displayed
- **WHEN** an operator opens a run-backed page
- **THEN** the page SHALL show which project, which review object, and which participating entity the current run belongs to

#### Scenario: Operator opens the overview
- **WHEN** the operator opens the opening-condition workspace overview
- **THEN** the overview shows project, review object, and participating entity as separate first-class context blocks
- **AND** the selected context is visually distinguished from other available contexts

### Requirement: Project-scoped object catalog
The system SHALL derive a project-scoped catalog from workspace metadata for operator-facing context switching.

#### Scenario: Same project contains multiple review objects
- **WHEN** the selected project contains more than one review object
- **THEN** the portal SHALL group available contexts by review object first and participating entity second

#### Scenario: Operator switches context
- **WHEN** the operator switches to another participating entity under the same review object or another review object under the same project
- **THEN** the portal SHALL load the corresponding packet, run history, readiness, and knowledge-base context for that selection only

#### Scenario: Overview presents switchable object records
- **WHEN** the project catalog is shown on the overview
- **THEN** each review object row shows its object type, participant count, participating entities, contract package, and selected state
- **AND** switching context remains a deliberate button action rather than a hidden side effect
