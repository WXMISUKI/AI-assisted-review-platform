## ADDED Requirements

### Requirement: ZIP manifest diagnostics in operational contract
The system SHALL expose bounded ZIP manifest inventory diagnostics through the opening-condition pilot operational contracts.

#### Scenario: Intake result includes ZIP manifest resolution
- **WHEN** packet inventory is derived from a readable ZIP object
- **THEN** the intake result and stored task expose a safe inventory resolution value indicating ZIP manifest derivation

#### Scenario: Packet event exposes ZIP fallback diagnostics
- **WHEN** packet intake cannot derive inventory from a ZIP object and falls back to `sourceObjects`
- **THEN** the packet-uploaded event includes safe fallback diagnostics such as fallback reason and the referenced ZIP source object id without exposing private object bytes or URLs
