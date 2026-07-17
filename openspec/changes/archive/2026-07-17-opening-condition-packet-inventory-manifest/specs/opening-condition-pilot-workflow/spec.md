## ADDED Requirements

### Requirement: Task-owned packet inventory manifest
The system SHALL persist a task-owned packet inventory manifest for opening-condition pilot packets.

#### Scenario: Packet is stored with explicit inventory entries
- **WHEN** intake/init or packet intake receives bounded inventory entries
- **THEN** the pilot packet stores those entries as task-owned packet facts alongside checklist and source object references

#### Scenario: Packet has no explicit inventory input
- **WHEN** a packet is accepted without explicit inventory entries
- **THEN** the backend derives a bounded default inventory manifest from the submitted source objects and records that resolution in safe diagnostics
