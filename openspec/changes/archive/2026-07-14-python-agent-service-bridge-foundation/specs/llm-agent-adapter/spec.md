# llm-agent-adapter Delta

## ADDED Requirements

### Requirement: Agent service review-generation request schema
The backend agent adapter SHALL send only bounded safe review-generation context to an external agent service.

#### Scenario: Request is constructed
- **WHEN** the worker delegates generation to the agent service
- **THEN** the adapter request contains schema version, run id, task id, mode, structure summary, bounded paragraph excerpts, max issue count, and safe provider summaries

#### Scenario: Source context is too large
- **WHEN** OCR or recovered document context exceeds configured bounds
- **THEN** the adapter truncates or summarizes context before sending it across the bridge

### Requirement: Agent service review-generation response schema
The backend agent adapter SHALL accept only schema-valid generation responses from an external agent service.

#### Scenario: Response is valid
- **WHEN** the agent service returns valid stage events, preparation package summary, draft issue generation result, diagnostics, and completion metadata
- **THEN** the adapter maps the result into the existing generation run completion contract

#### Scenario: Response contains unsafe diagnostics
- **WHEN** the agent service response includes prompts, raw traces, credentials, private URLs, or unbounded text
- **THEN** the adapter removes unsafe fields or rejects the response before persistence and SSE replay

### Requirement: Agent adapter has local fallback parity
The backend agent adapter SHALL return the same high-level result contract for both external agent service execution and local fallback execution.

#### Scenario: Local fallback runs
- **WHEN** external delegation is disabled or fails
- **THEN** the adapter returns source, status, stage events, preparation package, draft issue generation, diagnostics, and completion metadata using the local generation path
