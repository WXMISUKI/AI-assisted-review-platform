## MODIFIED Requirements

### Requirement: Platform-owned material packet manifest
The front platform SHALL own material packet context, ZIP manifest extraction, file inventory, derived file-asset mapping, initial document type classification, and operator confirmation state.

#### Scenario: Material packet contains mixed files
- **WHEN** a ZIP material packet contains PDFs, Office documents, images, folders, and unsupported files
- **THEN** the platform records a bounded manifest with file name, path, size, extension, detected type, scope status, source packet reference, and object/evidence reference before provider ingestion
- **AND** supported files MAY also receive platform-owned derived file assets for preview and downstream workflow reuse

#### Scenario: File classification is uncertain
- **WHEN** the platform cannot confidently classify a file against the checklist or project context
- **THEN** the file is marked for operator review instead of being silently ingested as valid evidence

#### Scenario: Provider-facing handoff needs stable single-file input
- **WHEN** the platform later submits packet content to OCR Worker, MaxKB Provider Proxy, or another downstream processor
- **THEN** it uses the derived file asset reference when one exists
- **AND** it falls back to manifest-only entry metadata when a derived file asset was not created
