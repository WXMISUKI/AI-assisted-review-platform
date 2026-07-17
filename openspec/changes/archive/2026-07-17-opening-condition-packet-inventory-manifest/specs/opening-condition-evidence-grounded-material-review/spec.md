## ADDED Requirements

### Requirement: Inventory-first evidence matching
The system SHALL use packet inventory entries as the preferred deterministic candidate source for opening-condition material matching.

#### Scenario: Matching runs with packet inventory entries
- **WHEN** a pilot packet has inventory entries
- **THEN** deterministic matching evaluates checklist hints against those entry names and summaries before falling back to coarser packet object references

#### Scenario: Evidence points back to packet entry support
- **WHEN** a checklist item matches a packet inventory entry that is linked to a source object
- **THEN** the resulting evidence keeps safe traceability to that source object while preserving the matched entry name or path summary for operator understanding
