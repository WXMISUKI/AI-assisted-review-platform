# maxkb-material-packet-coordination Specification

## Purpose
Define the responsibility split between the front platform, OCR Worker / MaxKB Provider Proxy, and MaxKB when opening-condition review uses ZIP material packets and mixed file types.

## Requirements
### Requirement: Platform-owned material packet manifest
The front platform SHALL own material packet context, ZIP manifest extraction, file inventory, initial document type classification, and operator confirmation state.

#### Scenario: Material packet contains mixed files
- **WHEN** a ZIP material packet contains PDFs, Office documents, images, folders, and unsupported files
- **THEN** the platform records a bounded manifest with file name, path, size, extension, detected type, scope status, and object/evidence reference before provider ingestion

#### Scenario: File classification is uncertain
- **WHEN** the platform cannot confidently classify a file against the checklist or project context
- **THEN** the file is marked for operator review instead of being silently ingested as valid evidence

### Requirement: MaxKB provider remains retrieval support
The MaxKB-side provider SHALL store and retrieve OCR-derived chunks with platform metadata, but MUST NOT own project state, checklist conclusions, human decisions, or report status.

#### Scenario: Provider returns retrieval hits
- **WHEN** MaxKB returns search or retrieval-check hits for a checklist item
- **THEN** the platform records only safe provider refs, scores, snippets, locators, and related platform evidence ids as supporting recall

#### Scenario: Provider conflicts with platform facts
- **WHEN** provider recall conflicts with published basis, confirmed master data, or human review decisions
- **THEN** the platform keeps its own facts authoritative and routes the conflict to human review

### Requirement: Provider-side packet endpoints
The MaxKB-side OCR Worker / Provider Proxy SHOULD expose provider endpoints that accept platform file refs and metadata for batch OCR ingestion and retrieval-check without requiring the platform to hold MaxKB administrator credentials.

#### Scenario: Platform submits batch ingestion
- **WHEN** the platform submits a material packet batch for provider processing
- **THEN** the provider accepts platform identifiers, idempotency key, source object refs, file metadata, document category hints, file-type routing hints, checklist item hints, and correlation id, then returns per-file processing status and safe provider document refs

#### Scenario: Platform runs retrieval check
- **WHEN** the platform asks the provider to check a checklist item against a knowledge id
- **THEN** the provider returns bounded hits and diagnostics without raw credentials, full private URLs, raw OCR full text, or unbounded provider traces

#### Scenario: Provider receives unsupported file
- **WHEN** the batch contains a file type that the provider cannot OCR or ingest
- **THEN** the provider returns a per-file unsupported status and safe reason so the platform can route it to operator review or out-of-scope handling
