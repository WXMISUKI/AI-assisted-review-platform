## ADDED Requirements

### Requirement: Safe backend configuration
The system SHALL load LLM and OCR credentials from server-side environment variables only.

#### Scenario: Backend starts
- **WHEN** the backend starts
- **THEN** it reads OpenAI-compatible and PaddleOCR configuration from environment variables without embedding secrets in source code

#### Scenario: Browser requests configuration status
- **WHEN** the frontend requests backend connectivity status
- **THEN** the backend returns whether required settings are configured without returning raw secrets

### Requirement: Backend health endpoint
The system SHALL provide a local backend health endpoint for development.

#### Scenario: Health endpoint is called
- **WHEN** a client requests `/api/health`
- **THEN** the backend returns service status, timestamp, and configured provider flags

### Requirement: Frontend proxy support
The system SHALL allow the Vite development server to proxy `/api` requests to the backend.

#### Scenario: Frontend calls API
- **WHEN** the Vite dev server receives an `/api` request
- **THEN** it proxies the request to the local backend during development
