# backend-connectivity Specification

## Purpose
TBD - created by archiving change backend-connectivity-and-agent-adapter-foundation. Update Purpose after archive.
## Requirements
### Requirement: Queue readiness summary
The backend connectivity surface SHALL include safe review worker queue readiness information.

#### Scenario: Connectivity status is requested
- **WHEN** the frontend or developer diagnostics request backend connectivity information
- **THEN** the backend can return queue adapter type, readiness, job counts by status, active worker summary, and oldest queued job age

#### Scenario: Queue is unavailable
- **WHEN** the queue adapter cannot be read or the worker loop is unavailable
- **THEN** the connectivity surface reports a degraded queue summary without exposing storage paths or unsafe job payload data

### Requirement: Queue diagnostics remain non-secret
Queue diagnostics SHALL never expose prompts, secrets, provider raw traces, private URLs, raw document text, or unbounded job payloads.

#### Scenario: Job diagnostics include sensitive source data
- **WHEN** queue status or job summaries are returned through backend connectivity helpers
- **THEN** only safe counts, statuses, identifiers, timestamps, and bounded messages are exposed

### Requirement: Safe backend configuration
The system SHALL load LLM, OCR, and MinIO credentials from server-side environment variables only.

#### Scenario: Backend starts
- **WHEN** the backend starts
- **THEN** it reads OpenAI-compatible, PaddleOCR, and MinIO configuration from environment variables without embedding secrets in source code

#### Scenario: Browser requests configuration status
- **WHEN** the frontend requests backend connectivity status
- **THEN** the backend returns whether required settings are configured without returning raw secrets

### Requirement: Backend health endpoint
The system SHALL provide a local backend health endpoint for development.

#### Scenario: Health endpoint is called
- **WHEN** a client requests `/api/health`
- **THEN** the backend returns service status, timestamp, and configured provider flags including LLM, OCR, and MinIO readiness metadata

### Requirement: Frontend proxy support
The system SHALL allow the Vite development server to proxy `/api` requests to the backend.

#### Scenario: Frontend calls API
- **WHEN** the Vite dev server receives an `/api` request
- **THEN** it proxies the request to the local backend during development

