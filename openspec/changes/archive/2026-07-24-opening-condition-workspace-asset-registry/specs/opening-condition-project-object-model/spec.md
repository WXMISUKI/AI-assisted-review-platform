## MODIFIED Requirements

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

#### Scenario: Overview presents asset-aware workspace records
- **WHEN** the project catalog is shown on the overview
- **THEN** each selectable workspace record also shows its workspace-scoped asset summary, including basis ownership, master-data readiness, knowledge-base readiness, and historical run presence
- **AND** operators can compare neighboring workspace contexts without entering each page first
