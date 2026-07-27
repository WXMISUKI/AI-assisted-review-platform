# opening-condition-packet-item-assets Specification

## Purpose
Define how opening-condition material packet inventory entries can own stable, platform-managed derived file assets created from ZIP packet contents.

## Requirements
### Requirement: Packet inventory entries can own derived file assets
The system SHALL allow an opening-condition packet inventory entry to reference a platform-owned derived file asset created from a ZIP material packet.

#### Scenario: ZIP packet contains previewable files
- **WHEN** intake/init reads a ZIP material packet containing supported files such as PDF, Office documents, or images
- **THEN** the platform creates one bounded derived file asset per supported entry
- **AND** each inventory entry records its file name, relative path, source ZIP object id, and the derived asset reference

#### Scenario: ZIP packet entry cannot be mirrored as an asset
- **WHEN** a ZIP entry is unsupported, unsafe, or exceeds bounded extraction limits
- **THEN** the platform keeps the inventory entry as manifest-only
- **AND** it records a safe fallback reason without inventing a derived file asset

### Requirement: Derived file assets remain traceable to the source packet
The system SHALL preserve traceability from every derived packet file asset back to the uploaded source packet and manifest entry.

#### Scenario: Operator inspects a derived packet file
- **WHEN** the platform shows a derived packet file in the document library, review detail, or human-review preview
- **THEN** the file can be traced to its packet id, source ZIP object id, and relative path within the original packet

#### Scenario: Archived task reuses packet file facts
- **WHEN** an archived or historical run is read
- **THEN** the task still exposes the stored derived asset mapping or manifest-only fallback
- **AND** the platform does not need to re-read the original ZIP to explain the file source
