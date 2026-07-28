## ADDED Requirements

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
