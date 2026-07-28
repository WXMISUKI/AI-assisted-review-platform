# maxkb-material-packet-coordination Specification

## Purpose
Define the responsibility split between the front platform, OCR Worker / MaxKB Provider Proxy, and MaxKB when opening-condition review uses ZIP material packets and mixed file types.

## Requirements
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

### Requirement: MaxKB provider remains retrieval support
The MaxKB-side provider SHALL store and retrieve OCR-derived chunks with platform metadata, but MUST NOT own project state, checklist conclusions, human decisions, or report status.

#### Scenario: Provider returns retrieval hits
- **WHEN** MaxKB returns search or retrieval-check hits for a checklist item
- **THEN** the platform records only safe provider refs, scores, snippets, locators, and related platform evidence ids as supporting recall

#### Scenario: Provider conflicts with platform facts
- **WHEN** provider recall conflicts with published basis, confirmed master data, or human review decisions
- **THEN** the platform keeps its own facts authoritative and routes the conflict to human review

### Requirement: Provider-side packet endpoints
The MaxKB-side OCR Worker / Provider Proxy SHALL expose provider endpoints that accept platform file refs and metadata for batch OCR ingestion and retrieval-check without requiring the platform to hold MaxKB administrator credentials.

#### Scenario: Platform submits batch ingestion
- **WHEN** the platform submits a material packet batch for provider processing
- **THEN** the provider accepts platform identifiers, idempotency key, source object refs, file metadata, document category hints, file-type routing hints, checklist item hints, and correlation id, then returns per-file processing status and safe provider document refs

#### Scenario: Platform runs retrieval check
- **WHEN** the platform asks the provider to check a checklist item against a knowledge id
- **THEN** the provider returns bounded hits and diagnostics without raw credentials, full private URLs, raw OCR full text, or unbounded provider traces

#### Scenario: Provider receives unsupported file
- **WHEN** the batch contains a file type that the provider cannot OCR or ingest
- **THEN** the provider returns a per-file unsupported status and safe reason so the platform can route it to operator review or out-of-scope handling

### Requirement: Provider content ingestion returns bounded file facts
The provider coordination contract SHALL allow packet file ingestion outputs to be normalized into bounded platform content facts.

#### Scenario: Platform receives provider ingestion output
- **WHEN** OCR Worker or MaxKB Provider Proxy returns per-file ingestion results
- **THEN** the platform stores safe status, summaries, snippets, locators, scores, provider document ids, and provider chunk ids
- **AND** the platform omits raw OCR full text, private URLs, credentials, and unbounded traces

### Requirement: Retrieval checks are item-scoped
The provider coordination contract SHALL treat retrieval checks as checklist-item-scoped support rather than task ownership.

#### Scenario: Platform records retrieval-check output
- **WHEN** a provider returns retrieval-check output for a checklist item
- **THEN** the platform records bounded hits and diagnostics linked to the item and related evidence
- **AND** MaxKB does not own checklist conclusions, human decisions, or report status

### Requirement: Provider ingestion is task-scoped
The provider coordination contract SHALL submit packet content extraction results to a task-scoped platform endpoint.

#### Scenario: Provider posts batch results
- **WHEN** OCR Worker or MaxKB Provider Proxy completes batch processing for packet files
- **THEN** it posts safe per-file facts to the platform task endpoint
- **AND** the platform owns the task state, content-fact merge, checklist conclusions, human decisions, and reports

#### Scenario: Provider reports unsupported files
- **WHEN** a provider cannot process a packet file type
- **THEN** it returns a safe unsupported status and reason
- **AND** the platform records the unsupported fact and keeps affected checklist items eligible for human review
