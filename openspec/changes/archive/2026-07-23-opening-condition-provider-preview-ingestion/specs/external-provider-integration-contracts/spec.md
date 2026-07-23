## MODIFIED Requirements

### Requirement: Provider adapter boundary
The system SHALL integrate external providers through platform-owned adapters that preserve platform records as the source of truth.

#### Scenario: Provider output is received
- **WHEN** an external provider returns OCR, LLM, RAG, worker, storage, or queue output
- **THEN** the system normalizes the output into platform-owned records or safe summaries before it affects workflow state, review results, readiness, or reports
- **AND** opening-condition basis preview ingestion can consume provider output only after normalization into the platform-owned preview contract

#### Scenario: Provider is unavailable
- **WHEN** an optional provider is disabled, not configured, or unavailable
- **THEN** the platform reports degraded or disabled readiness without exposing secrets and without corrupting existing platform records
