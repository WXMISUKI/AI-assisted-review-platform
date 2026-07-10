## ADDED Requirements

### Requirement: Agent connectivity panel
The data assets page SHALL expose a safe backend connectivity panel for configured agent resources.

#### Scenario: User opens data assets
- **WHEN** the data assets page is displayed
- **THEN** it shows backend, LLM, OCR, and streaming readiness status without revealing secrets

#### Scenario: User runs connectivity checks
- **WHEN** the user triggers backend connectivity checks
- **THEN** the page displays success or safe failure summaries for health, LLM, OCR, and streaming endpoints
