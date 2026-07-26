## MODIFIED Requirements

### Requirement: Master-data candidate diagnostics
The pilot operational API SHALL return bounded diagnostics for master-data candidate preview and decision flows.

#### Scenario: Operator ingests master-data provider preview
- **WHEN** the frontend submits provider structured preview output for a workspace master-data record
- **THEN** the API returns the normalized master-data record with safe preview facts, missing fields, confidence, source evidence, and next action
- **AND** the API does not expose raw provider traces, private URLs, prompts, credentials, or unbounded OCR text

### Requirement: Preflight master-data readiness diagnostics
The pilot operational API SHALL explain master-data readiness using operator-facing current-run semantics.

#### Scenario: Provider-derived candidate is not yet usable
- **WHEN** a current run depends on master-data records that only have provisional provider-derived preview facts
- **THEN** the API keeps formal matching blocked or gated according to existing rules
- **AND** the returned readiness explains that provider preview alone does not make the record usable for formal checks
