## ADDED Requirements

### Requirement: Master-data candidate API diagnostics
The pilot operational API SHALL return bounded diagnostics for master-data candidates and decisions.

#### Scenario: Master data is listed
- **WHEN** the frontend requests workspace master data
- **THEN** the API returns lifecycle status, operator-facing readiness fields, source evidence, candidate facts, missing fields, confidence, and next action where available

#### Scenario: Master data decision succeeds
- **WHEN** the frontend submits a confirm, publish, or reject decision for a master-data record
- **THEN** the API returns the normalized record with updated lifecycle fields and safe audit metadata

#### Scenario: Master data decision fails
- **WHEN** the frontend submits a decision for a missing record or invalid state
- **THEN** the API returns a safe error payload without exposing raw provider output, raw OCR text, private URLs, prompts, credentials, or stack traces

### Requirement: Preflight master-data readiness diagnostics
The pilot operational API SHALL explain master-data readiness using operator-facing blocking reasons.

#### Scenario: Required master data is missing
- **WHEN** formal matching readiness is evaluated and required master data is absent
- **THEN** the API returns a bounded blocking reason and next action for master-data preparation

#### Scenario: Required master data is provisional
- **WHEN** formal matching readiness is evaluated and required master data exists only as provisional candidates
- **THEN** the API returns a bounded blocking reason and next action for candidate confirmation

#### Scenario: Required master data is current-run confirmed
- **WHEN** formal matching readiness is evaluated and required master data is explicitly `human_approved`
- **THEN** the API can mark the pilot run master-data gate as ready while preserving diagnostics that the record is not a reusable published catalog fact
