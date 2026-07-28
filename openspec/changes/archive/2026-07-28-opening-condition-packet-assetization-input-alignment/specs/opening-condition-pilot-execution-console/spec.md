## ADDED Requirements

### Requirement: Document preview targets derived packet files first
The selected task document library SHALL open a derived packet file asset when an inventory entry has one, and SHALL only fall back to the source archive when no standalone object exists.

#### Scenario: Inventory row has derived asset
- **WHEN** the operator clicks a document-library row backed by a packet inventory entry with `derivedObjectRef`
- **THEN** the preview request uses the derived object's storage key and file metadata
- **AND** opening the original file downloads or opens that derived child file rather than the uploaded ZIP archive

#### Scenario: Inventory row has no derived asset
- **WHEN** the operator clicks a manifest-only inventory row
- **THEN** the preview shows a bounded fallback explaining no standalone stored object exists for inline preview
- **AND** it may expose the source archive as a fallback action without implying that the archive is the child file
