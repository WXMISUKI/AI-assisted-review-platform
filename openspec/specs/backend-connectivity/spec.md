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

### Requirement: Agent service readiness summary
The backend connectivity surface SHALL include a safe readiness summary for the configured Python agent service bridge.

#### Scenario: Agent service is configured and reachable
- **WHEN** backend connectivity is requested
- **THEN** the response includes safe configured, ready, status, source, summary, and bounded diagnostics for the agent service

#### Scenario: Agent service is disabled or missing configuration
- **WHEN** no agent service base configuration is present
- **THEN** the response reports a disabled or local-fallback summary without treating the backend as unhealthy

#### Scenario: Agent service is unavailable
- **WHEN** the configured agent service health check fails or times out
- **THEN** the response reports degraded readiness and a safe bounded reason

### Requirement: Agent service diagnostics remain non-secret
Agent service readiness diagnostics SHALL never expose secrets, private URLs, raw OCR text, prompts, provider traces, or service auth headers.

#### Scenario: Health check error contains sensitive details
- **WHEN** an agent service health check or invocation fails with a detailed error
- **THEN** the backend connectivity response includes only a safe status and bounded message

### Requirement: External provider readiness summary
The backend connectivity surface SHALL include safe readiness summaries for optional external provider adapters including RAG and agent-worker providers.

#### Scenario: RAG provider is configured
- **WHEN** backend connectivity is requested and a RAG provider such as RAGFlow is configured
- **THEN** the response includes configured, ready, status, source, provider type, and safe summary fields for the RAG provider

#### Scenario: RAG provider is disabled
- **WHEN** no RAG provider is enabled
- **THEN** the response reports the RAG provider as disabled or unconfigured without treating the backend as unhealthy

#### Scenario: Agent worker provider is configured
- **WHEN** a separate agent worker service is configured
- **THEN** the response includes a safe readiness summary for the worker service without exposing auth headers, raw payloads, or service internals

### Requirement: MaxKB provider readiness summary
The backend connectivity surface SHALL include a safe readiness summary for MaxKB when it is selected as the knowledge-base provider.

#### Scenario: MaxKB is selected and configured
- **WHEN** backend connectivity or knowledge-base provider status is requested
- **THEN** the response includes MaxKB provider status, configured flag, ready flag, selected provider name, timeout summary, and safe diagnostics without exposing secrets

#### Scenario: Another knowledge provider is selected
- **WHEN** RAGFlow or mock provider is selected instead of MaxKB
- **THEN** the backend reports the selected knowledge provider without requiring MaxKB configuration

