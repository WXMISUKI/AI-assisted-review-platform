# llm-agent-adapter Specification

## Purpose

Ensure draft issue generation responses provide enough safe provenance metadata for task-level recovery and reviewer trust.

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
