## MODIFIED Requirements

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
