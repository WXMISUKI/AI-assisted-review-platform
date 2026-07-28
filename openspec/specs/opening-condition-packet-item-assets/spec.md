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

### Requirement: ZIP inventory entry identity is stable per source path
The system SHALL assign ZIP packet inventory entries a stable id derived from the source archive object and the normalized ZIP relative path rather than from display order alone.

#### Scenario: Manifest and preview extraction see the same path
- **WHEN** the ZIP manifest pass and derived-preview pass both process the same normalized relative path from the same source archive object
- **THEN** both records use the same inventory entry id
- **AND** the derived preview asset can be attached back to the matching inventory entry without relying on array order

#### Scenario: ZIP contains repeated file basenames in different folders
- **WHEN** a ZIP packet contains files with the same basename under different relative folders
- **THEN** each inventory entry receives a distinct id
- **AND** the operator can distinguish and preview the entries by their relative path

### Requirement: Supported ZIP entries attach derived preview assets
The system SHALL attach a stable derived object reference to each supported, bounded ZIP packet entry when the source archive can be read and the derived object upload succeeds.

#### Scenario: Supported entry is assetized
- **WHEN** intake reads a ZIP source object containing a supported PDF, Office document, text file, or image within bounded size limits
- **THEN** the corresponding packet inventory entry records `assetizationStatus: "derived_object_ready"`
- **AND** it records `derivedObjectRef` with the uploaded derived file's object id, file name, storage key, content type, and source archive traceability

#### Scenario: Unsupported entry remains manifest-only
- **WHEN** a ZIP source object contains an unsupported, unsafe, directory, or oversize entry
- **THEN** the packet inventory entry remains visible with `assetizationStatus: "manifest_only"`
- **AND** it records a safe fallback reason instead of pointing preview to the source ZIP as if it were the child file

### Requirement: Derived inventory identity is path-stable
The system SHALL derive inventory entry ids from the source archive object and normalized relative path so repeated file basenames do not collide.

#### Scenario: ZIP has duplicate basenames
- **WHEN** a ZIP source contains two files with the same basename in different folders
- **THEN** each inventory entry gets a distinct id
- **AND** each derived object remains attached to the inventory entry with the matching relative path
