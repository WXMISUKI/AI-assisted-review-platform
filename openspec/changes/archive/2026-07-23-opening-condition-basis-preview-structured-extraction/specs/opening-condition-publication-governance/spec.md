## MODIFIED Requirements

### Requirement: Basis preview governance queue
The opening-condition publication governance workspace SHALL distinguish basis records by preview and publication readiness instead of showing only raw status values.

#### Scenario: Operator reviews basis preview queue
- **WHEN** basis records exist for the selected workspace
- **THEN** the governance page groups or labels them as needs-preview-confirmation, publish-ready, published, or exception records
- **AND** each basis record shows source file, preview fact summary, missing fields, confidence, extraction provenance, and next action

#### Scenario: Operator reviews current-run basis preview
- **WHEN** a pilot run is selected and bound to a basis record or basis version
- **THEN** the governance page highlights the run-bound basis preview separately from the workspace catalog
- **AND** it explains whether the current run can proceed to formal matching

### Requirement: Basis preview safe display
The publication governance workspace SHALL display only safe preview facts and bounded summaries.

#### Scenario: Unsafe provider data is present in an incoming basis payload
- **WHEN** the backend stores the basis preview
- **THEN** private URLs, tokens, raw OCR text, raw prompts, provider traces, and credentials are removed from stored and returned preview data
