# agent-review-kernel Specification

## Purpose

Constrain LLM semantic draft findings so they remain compatible with the construction plan review kernel.

## Requirements

### Requirement: LLM semantic candidate validation
The review kernel SHALL treat LLM-generated findings as semantic candidates that require schema and anchor validation before persistence.

#### Scenario: LLM candidate includes kernel metadata
- **WHEN** the LLM emits a semantic finding
- **THEN** the candidate includes check domain, check item, output scenario, compliance category, basis priority, and schema version where available

#### Scenario: LLM candidate lacks traceability
- **WHEN** the LLM emits a finding without a resolvable source anchor or review basis
- **THEN** the candidate is not promoted to a persisted review issue

### Requirement: Deterministic fallback remains authoritative
The review kernel SHALL preserve deterministic draft rules as the fallback authority when LLM generation is unavailable or invalid.

#### Scenario: LLM output cannot be trusted
- **WHEN** LLM output fails validation
- **THEN** deterministic draft issues remain available and the task can continue through the human review workflow
