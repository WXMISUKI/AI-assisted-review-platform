## ADDED Requirements

### Requirement: Local runtime health exposes DOCX fetch diagnostics
The local development runtime SHALL expose safe runtime diagnostics needed to debug DOCX object parsing.

#### Scenario: Developer checks backend health
- **WHEN** the frontend or a developer requests `/api/health`
- **THEN** the backend returns a safe runtime summary including the active Node version, whether `globalThis.fetch` is available, and which DOCX object-download fetch mode is active

#### Scenario: Runtime is unsupported
- **WHEN** the active local runtime does not provide the fetch capability required by DOCX object parsing
- **THEN** the health payload makes that unsupported state visible without leaking secrets or internal URLs
