# llm-agent-adapter Specification

## Purpose

Allow the backend generation run stream to own draft issue generation while reusing the existing adapter result contract and safety rules.

## Requirements

### Requirement: Stream-owned draft issue generation
The LLM draft issue adapter SHALL be callable from the backend generation run stream after preparation package creation.

#### Scenario: Stream reaches issue generation stage
- **WHEN** a run-specific stream has created a preparation package and has bounded paragraph excerpts
- **THEN** the backend can invoke the draft issue adapter and attach its structured result to the run completion payload

#### Scenario: Adapter returns fallback
- **WHEN** the adapter cannot use the configured LLM provider or returns deterministic fallback
- **THEN** the stream completion payload preserves the adapter source, status, safe diagnostics, and fallback candidates

### Requirement: Adapter output remains safe for SSE completion
The adapter result included in stream completion SHALL remain safe to send to the frontend and store in the review task aggregate.

#### Scenario: Provider call fails
- **WHEN** the adapter catches a provider or parsing failure
- **THEN** stream completion includes only safe diagnostics and never includes raw prompts, API keys, tokens, private object URLs, or provider raw traces

#### Scenario: Paragraph context is unavailable
- **WHEN** the run input has no usable paragraph excerpts
- **THEN** the adapter returns a safe empty or fallback result without attempting unbounded generation

### Requirement: Draft endpoint compatibility
The standalone draft issue endpoint SHALL remain available while the run bridge is introduced.

#### Scenario: Existing client calls draft endpoint
- **WHEN** a client posts to `/api/review-agent/draft-issues`
- **THEN** the endpoint continues returning the existing draft issue generation result contract
