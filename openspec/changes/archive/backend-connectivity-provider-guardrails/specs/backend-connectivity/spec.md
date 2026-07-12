## MODIFIED Requirements

### Requirement: Safe backend configuration
The system SHALL load LLM, OCR, and MinIO credentials from server-side environment variables only, and it SHALL expose only safe readiness metadata to clients.

#### Scenario: Backend starts
- **WHEN** the backend starts
- **THEN** it reads OpenAI-compatible, PaddleOCR, and MinIO configuration from environment variables without embedding secrets in source code

#### Scenario: Browser requests configuration status
- **WHEN** the frontend requests backend connectivity status
- **THEN** the backend returns whether required settings are configured, which provider groups are ready, and which public fields are safe to display without returning raw secrets

### Requirement: Backend health endpoint
The system SHALL provide a local backend health endpoint for development that summarizes provider readiness in a stable safe shape.

#### Scenario: Health endpoint is called
- **WHEN** a client requests `/api/health`
- **THEN** the backend returns service status, timestamp, and configured provider flags including LLM, OCR, and MinIO readiness metadata

#### Scenario: One provider is misconfigured
- **WHEN** one provider is missing required configuration
- **THEN** the health payload still returns the other provider readiness flags and a safe overall diagnostic without exposing secrets

### Requirement: Frontend proxy support
The system SHALL allow the Vite development server to proxy `/api` requests to the backend.

#### Scenario: Frontend calls API
- **WHEN** the Vite dev server receives an `/api` request
- **THEN** it proxies the request to the local backend during development
