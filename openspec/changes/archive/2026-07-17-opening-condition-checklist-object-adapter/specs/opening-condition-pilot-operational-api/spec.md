## ADDED Requirements

### Requirement: Checklist adapter diagnostics contract
The system SHALL expose bounded checklist adapter diagnostics through the opening-condition pilot intake/init contract.

#### Scenario: Intake returns checklist adapter outcome
- **WHEN** the intake/init API returns
- **THEN** the payload includes whether checklist-definition resolution came from direct input, controlled template derivation, existing-task fallback, or unresolved manual action

#### Scenario: Frontend defaults to backend adaptation
- **WHEN** the portal initializes a known pilot checklist object
- **THEN** the frontend may omit checklist-definition items and rely on the backend checklist-object adapter as the default path
