# backend-connectivity Delta

## ADDED Requirements

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
