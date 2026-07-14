# llm-agent-adapter Specification

## Purpose

Define a backend adapter that can turn review-preparation context into validated structured review issue candidates.

## Requirements

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
