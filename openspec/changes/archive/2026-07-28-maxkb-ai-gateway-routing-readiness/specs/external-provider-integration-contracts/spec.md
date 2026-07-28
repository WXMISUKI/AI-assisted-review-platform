## ADDED Requirements

### Requirement: MaxKB enterprise gateway access boundary
The platform SHALL recognize the MaxKB AI gateway `app_code` routing contract as the preferred enterprise-facing access boundary for MaxKB application capabilities.

#### Scenario: Business system invokes a MaxKB-backed application
- **WHEN** a business system needs OpenAI-compatible or MCP access to a MaxKB application
- **THEN** the platform contract uses stable `app_code` routing through the gateway rather than exposing MaxKB `application_id`, MaxKB internal URLs, or MaxKB API keys to the caller

#### Scenario: Provider output reaches platform workflow
- **WHEN** MaxKB gateway, OpenAI-compatible, MCP, or retrieval output is consumed by platform workflows
- **THEN** the platform normalizes the output into safe support records before it can affect readiness, review diagnostics, or report drafting
- **AND** formal conclusions remain governed by platform-owned review records and human decisions
