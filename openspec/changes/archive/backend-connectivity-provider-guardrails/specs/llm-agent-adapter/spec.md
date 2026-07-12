## MODIFIED Requirements

### Requirement: OpenAI-compatible LLM client
The backend SHALL provide an LLM client based on the official OpenAI SDK and configured through environment variables, and it SHALL return safe connectivity diagnostics without exposing secrets.

#### Scenario: LLM connectivity check succeeds
- **WHEN** the backend calls the configured OpenAI-compatible provider with a minimal prompt
- **THEN** it returns a safe connectivity result containing provider status, the configured model, and a short model response preview

#### Scenario: LLM connectivity check fails
- **WHEN** the provider is unavailable or misconfigured
- **THEN** the backend returns a safe error summary without exposing the API key

### Requirement: Review agent event adapter
The backend SHALL expose a review-agent test endpoint that maps agent progress to review-style events with a stable start and completion boundary.

#### Scenario: Streaming test starts
- **WHEN** a client connects to the review-agent stream endpoint
- **THEN** the backend emits ordered events for connection, model preparation, reasoning, issue drafting, and completion

#### Scenario: Streaming test completes
- **WHEN** the deterministic connectivity stream reaches its final event
- **THEN** the backend emits a completion event that can be consumed by a locked loading view or a future review workbench
