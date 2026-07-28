## ADDED Requirements

### Requirement: Packet intake initializes content facts
The platform SHALL initialize bounded packet content facts during opening-condition packet intake.

#### Scenario: Inventory entry has standalone preview asset
- **WHEN** packet intake creates or receives an inventory entry with a standalone derived object or non-archive source object
- **THEN** the platform creates a packet content fact linked to that entry
- **AND** the fact records safe file metadata and a pending or ready extraction status without claiming full OCR verification

#### Scenario: Inventory entry has no standalone preview asset
- **WHEN** packet intake receives a manifest-only entry without a standalone derived object
- **THEN** the platform creates a bounded unsupported or partial content fact
- **AND** later semantic matching remains eligible for human review

### Requirement: Provider ingestion updates packet content facts
The platform SHALL accept task-scoped provider ingestion output and merge it into packet content facts.

#### Scenario: Provider returns extracted facts for packet files
- **WHEN** a provider submits safe per-file extraction results for a task packet
- **THEN** the platform normalizes and merges the results by packet entry id, derived object id, source object id, or normalized file name
- **AND** the task records a content ingestion event with safe diagnostics

#### Scenario: Provider output contains unsafe fields
- **WHEN** provider output includes raw text, private URLs, credentials, or provider traces
- **THEN** the platform redacts those fields before persisting the content facts
