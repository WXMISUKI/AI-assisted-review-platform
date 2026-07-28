## MODIFIED Requirements

### Requirement: Packet inventory entries can own derived file assets
The system SHALL allow an opening-condition packet inventory entry to reference a platform-owned derived file asset created from a ZIP material packet, and UI previews SHALL prefer that derived asset whenever it exists.

#### Scenario: ZIP packet contains previewable files
- **WHEN** intake/init reads a ZIP material packet containing supported files such as PDF, Office documents, or images
- **THEN** the platform creates one bounded derived file asset per supported entry
- **AND** each inventory entry records its file name, relative path, source ZIP object id, and the derived asset reference

#### Scenario: Inventory preview is requested after assetization
- **WHEN** an operator opens a packet inventory file that has a stored `derivedObjectRef`
- **THEN** the preview loads from that derived asset rather than the source ZIP object

#### Scenario: ZIP packet entry cannot be mirrored as an asset
- **WHEN** a ZIP entry is unsupported, unsafe, or exceeds bounded extraction limits
- **THEN** the platform keeps the inventory entry as manifest-only
- **AND** it records a safe fallback reason without inventing a derived file asset
- **AND** the UI explains that the operator is falling back to the source archive or historical manifest entry
