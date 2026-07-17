## ADDED Requirements

### Requirement: Packet inventory derivation during intake
The system SHALL resolve packet inventory manifest entries during intake/init.

#### Scenario: Direct packet inventory is provided
- **WHEN** intake/init includes bounded inventory entries for the packet
- **THEN** the backend stores them and reports that packet inventory resolution came from direct input

#### Scenario: Packet inventory is derived from source objects
- **WHEN** intake/init omits packet inventory entries
- **THEN** the backend derives a default inventory manifest from source objects, stores it on the packet, and reports the derived resolution and entry count
