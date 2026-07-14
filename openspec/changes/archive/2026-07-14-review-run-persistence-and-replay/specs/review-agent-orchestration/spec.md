# review-agent-orchestration Specification

## Purpose

Move review generation runs toward backend-owned, replayable orchestration state while preserving the current loading and fallback behavior.

## Requirements

### Requirement: Backend-owned generation run records
The review orchestration layer SHALL persist review generation run records independently of a single SSE connection.

#### Scenario: Generation run is created
- **WHEN** the frontend creates a backend review generation run
- **THEN** the backend stores a schema-versioned run record with task id, run id, mode, initial status, timestamps, structure summary, accepted input counts, and safe bounds

#### Scenario: Generation run is reopened
- **WHEN** the frontend requests a previously created run by id
- **THEN** the backend returns safe latest run state without requiring the original stream connection

### Requirement: Generation run lifecycle remains recoverable
The review orchestration layer SHALL keep latest run lifecycle state recoverable until the run expires or is pruned.

#### Scenario: Stage advances
- **WHEN** the backend generation bridge advances a preparation or draft issue stage
- **THEN** the persisted run record updates latest status, progress, active stage, update time, and safe stage summary

#### Scenario: Terminal state is reached
- **WHEN** generation becomes ready, degraded, or failed
- **THEN** the run record stores terminal status, completion time, safe diagnostics, and safe completion summaries

### Requirement: Run events are replayable
The review orchestration layer SHALL append bounded safe lifecycle events for each generation run.

#### Scenario: Event is emitted
- **WHEN** the backend emits a review generation event
- **THEN** it appends the event with a monotonic sequence number, run id, task id, event type, status, progress, and safe payload

#### Scenario: Event history is requested
- **WHEN** a client requests stored run events
- **THEN** the backend returns ordered safe events within configured bounds

### Requirement: Orchestration state is worker-replaceable
The persisted generation run contract SHALL be compatible with a future queue or Python worker updating the same run lifecycle.

#### Scenario: Future worker updates a run
- **WHEN** a worker service reports run progress, completion, degradation, or failure through the backend contract
- **THEN** the backend can map it into the same run record and event history without changing frontend loading consumers
