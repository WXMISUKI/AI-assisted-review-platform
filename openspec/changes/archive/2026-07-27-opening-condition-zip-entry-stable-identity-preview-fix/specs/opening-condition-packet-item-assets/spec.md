## ADDED Requirements

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
