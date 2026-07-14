# review-agent-orchestration Delta

## ADDED Requirements

### Requirement: Worker execution can delegate to an agent service
The review orchestration layer SHALL allow queued review-generation jobs to execute through a backend-facing agent service adapter.

#### Scenario: Agent service is ready
- **WHEN** a worker claims a review-generation job and a configured agent service is ready
- **THEN** the worker invokes the agent service through the adapter and maps its safe stage events and completion result into the persisted generation run

#### Scenario: Agent service is not configured
- **WHEN** a worker claims a review-generation job and no agent service is configured
- **THEN** the worker executes the existing local generation fallback through the same adapter result contract

### Requirement: Agent service failures degrade safely
The review orchestration layer SHALL preserve run recovery when agent service execution is unavailable, slow, or invalid.

#### Scenario: Agent service call fails
- **WHEN** the configured agent service returns an error, times out, or cannot be reached
- **THEN** the worker records safe fallback diagnostics and executes the local fallback without exposing secrets or raw provider traces

#### Scenario: Agent service response is invalid
- **WHEN** the agent service returns a response that does not match the accepted schema
- **THEN** the worker rejects the unsafe response, records a bounded diagnostic summary, and uses local fallback behavior

### Requirement: Agent execution source is traceable
The review orchestration layer SHALL record whether a generation run was produced by the Python agent service or local fallback.

#### Scenario: Run completes through agent service
- **WHEN** a delegated generation run reaches a terminal status
- **THEN** the run completion summary includes safe source, status, completion time, and diagnostic metadata

#### Scenario: Run completes through fallback
- **WHEN** a generation run falls back to local execution
- **THEN** the run completion summary identifies local fallback as the source and includes the safe fallback reason
