## ADDED Requirements

### Requirement: ZIP-backed packet inventory persistence
The system SHALL persist packet inventory entries that are extracted from uploaded ZIP source objects as task-owned packet facts.

#### Scenario: Packet stores ZIP-derived inventory entries
- **WHEN** a submitted packet contains a readable ZIP source object and no explicit inventory override
- **THEN** the packet stores the extracted ZIP entry list in `inventoryEntries` alongside the original packet source object references

#### Scenario: Packet inventory remains available after ZIP extraction fallback
- **WHEN** ZIP manifest extraction cannot produce packet inventory entries
- **THEN** the packet still persists a bounded derived inventory from source objects so the workflow can continue deterministically
