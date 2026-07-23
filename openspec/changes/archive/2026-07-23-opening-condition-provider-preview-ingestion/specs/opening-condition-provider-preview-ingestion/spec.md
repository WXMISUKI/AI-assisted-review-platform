## ADDED Requirements

### Requirement: Provider preview ingestion
The system SHALL ingest safe OCR/Provider structured outputs as provisional opening-condition basis preview facts.

#### Scenario: Provider facts are normalized into basis preview
- **WHEN** a provider ingestion action receives structured facts for a workspace basis record
- **THEN** the system maps approved fields such as project name, project id, contract package id, participating organization, qualification scope, personnel scope, equipment scope, effective period, and source summary into the basis preview
- **AND** the basis preview status becomes `needs_confirmation`

#### Scenario: Provider output keeps provenance
- **WHEN** provider-derived facts are stored on a basis preview
- **THEN** the preview records provider name, provider job id or document id when supplied, extractor, source object, bounded snippet information, confidence, matched signals, and extraction time without storing unsafe raw payloads

#### Scenario: Provider output cannot bypass human confirmation
- **WHEN** provider ingestion produces complete high-confidence preview facts
- **THEN** the basis still cannot be published until an operator confirms the preview

#### Scenario: Unsafe provider payload is sanitized
- **WHEN** provider output contains tokens, credentials, raw OCR text, prompts, provider traces, private URLs, cookies, sessions, or unbounded payloads
- **THEN** the stored preview excludes unsafe fields and keeps only bounded facts, safe snippets, provenance, missing fields, confidence, and next action

### Requirement: Provider preview ingestion API
The system SHALL expose a workspace basis action that ingests provider structured preview output into the governed basis preview lifecycle.

#### Scenario: Operator ingests provider preview
- **WHEN** the operator calls the provider preview ingestion API for a basis record
- **THEN** the system updates that basis record's preview and returns the normalized basis version
- **AND** the response explains any missing fields and next confirmation action

#### Scenario: Missing basis source is rejected
- **WHEN** provider preview ingestion is requested for a missing basis record or a basis record without a usable source object
- **THEN** the system returns a safe failure without mutating workspace records
