# llm-agent-adapter Specification

## Purpose
TBD - created by archiving change backend-connectivity-and-agent-adapter-foundation. Update Purpose after archive.
## Requirements
### Requirement: Draft issue generation provenance
The LLM draft issue adapter SHALL return safe generation provenance with each generation result.

#### Scenario: LLM generation succeeds
- **WHEN** the adapter returns validated LLM candidates
- **THEN** the response includes source, status, diagnostics, candidate count, and completion metadata that can become a task generation snapshot

#### Scenario: Adapter falls back
- **WHEN** the adapter uses deterministic fallback
- **THEN** the response includes fallback source and safe diagnostics without treating the review task as failed

#### Scenario: Adapter fails safely
- **WHEN** no usable candidates can be produced
- **THEN** the response includes non-secret diagnostics that can be stored without exposing provider secrets or raw prompts

### Requirement: Draft issue generation endpoint
The backend SHALL expose a draft issue generation boundary for review-preparation packages.

#### Scenario: Client requests draft issues
- **WHEN** the client submits a review-preparation package with recovered paragraph context
- **THEN** the backend returns structured draft issue candidates or a deterministic fallback result

#### Scenario: Request lacks usable paragraph context
- **WHEN** the request does not contain recovered paragraphs or paragraph excerpts
- **THEN** the backend returns a safe fallback or empty candidate result without invoking unbounded model prompts

### Requirement: OpenAI-compatible structured generation
The LLM adapter SHALL request strict JSON issue candidates from the configured OpenAI-compatible provider when available.

#### Scenario: LLM provider is configured
- **WHEN** provider readiness is available and the request has usable context
- **THEN** the adapter can ask for JSON candidates containing severity, paragraph anchor, finding fields, and kernel metadata

#### Scenario: LLM provider is not configured
- **WHEN** the provider is missing required configuration
- **THEN** the adapter returns deterministic fallback candidates and a safe diagnostic summary

### Requirement: Safe adapter diagnostics
The adapter SHALL return safe diagnostics without exposing secrets or raw provider credentials.

#### Scenario: Provider call fails
- **WHEN** the model request fails
- **THEN** the response includes a non-secret failure summary and preserves fallback behavior

### Requirement: OpenAI-compatible LLM client
The backend SHALL provide an LLM client based on the official OpenAI SDK and configured through environment variables.

#### Scenario: LLM connectivity check succeeds
- **WHEN** the backend calls the configured OpenAI-compatible provider with a minimal prompt
- **THEN** it returns a safe connectivity result containing provider status and a short model response preview

#### Scenario: LLM connectivity check fails
- **WHEN** the provider is unavailable or misconfigured
- **THEN** the backend returns a safe error summary without exposing the API key

### Requirement: Review agent event adapter
The backend SHALL expose a review-agent test endpoint that maps agent progress to review-style events.

#### Scenario: Streaming test starts
- **WHEN** a client connects to the review-agent stream endpoint
- **THEN** the backend emits ordered events for connection, model preparation, reasoning, issue drafting, and completion

#### Scenario: Streaming test includes recovered structure
- **WHEN** a client connects with recovered structure summary metadata
- **THEN** the backend can reflect the supplied section and paragraph context in the emitted review-style stage events without requiring a real LLM response

