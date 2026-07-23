# opening-condition-basis-preview-extraction Specification

## Purpose
Provide a deterministic, governed basis preview extraction contract so operators can refresh, confirm, and publish basis facts from safe metadata and bounded text before formal matching.
## Requirements
### Requirement: Structured basis preview extraction
The system SHALL derive structured basis preview facts from a basis source object and optional bounded preview text without storing unsafe raw provider data.

#### Scenario: Extract preview from basis metadata
- **WHEN** an operator requests preview extraction for a basis record that has a source object
- **THEN** the system derives candidate facts such as source file name, project id, contract package id, participating organization id, qualification scope, personnel scope, equipment scope, and source summary when those values are available
- **AND** the preview remains provisional until human confirmation

#### Scenario: Extract preview from bounded text
- **WHEN** bounded extracted text or summary text is supplied to the extraction action
- **THEN** the system uses recognizable labels and keywords to populate preview facts
- **AND** records missing required fact keys when the text does not provide enough information

#### Scenario: Unsafe extraction input is sanitized
- **WHEN** extraction input includes private URLs, tokens, raw OCR text, prompts, provider traces, or credentials
- **THEN** the stored and returned preview excludes unsafe fields and keeps only bounded facts, summary, provenance, confidence, and next action

### Requirement: Basis extraction action API
The system SHALL expose a workspace basis action that refreshes a basis record's ingestion preview from safe extracted inputs.

#### Scenario: Operator refreshes basis preview
- **WHEN** the operator calls the basis extraction API for a basis record
- **THEN** the system updates the record's ingestion preview with status `needs_confirmation`, extraction provenance, missing fields, confidence, and next action
- **AND** the basis cannot be published until the refreshed preview is confirmed

### Requirement: Provider-derived basis preview source
The system SHALL accept safe provider-derived structured output as an additional source for basis preview refresh.

#### Scenario: Provider output refreshes preview facts
- **WHEN** provider-derived structured facts are submitted for a basis source object
- **THEN** the system normalizes those facts into the same preview fact keys used by deterministic metadata and bounded-text extraction
- **AND** the preview remains provisional until human confirmation

#### Scenario: Provider missing fields are explicit
- **WHEN** provider output omits required basis preview fields
- **THEN** the system records missing field keys and a next action that asks the operator to review or supplement the preview
