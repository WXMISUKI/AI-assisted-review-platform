# review-streaming-api Specification

## Purpose

Make run-specific review streaming recoverable by adding status reads, event replay, and replay-before-tail SSE behavior.

## Requirements

### Requirement: Generation run status endpoint
The backend SHALL expose a safe read endpoint for persisted review generation runs.

#### Scenario: Client reads a run
- **WHEN** the frontend requests a generation run by id
- **THEN** the backend returns run id, task id, latest status, progress, active stage, timestamps, safe diagnostics, and replay endpoint metadata

#### Scenario: Run does not exist
- **WHEN** the requested run id is absent, expired, or pruned
- **THEN** the backend returns a safe not-found or expired response without leaking storage details

### Requirement: Generation run event history endpoint
The backend SHALL expose ordered event history for a persisted review generation run.

#### Scenario: Client requests all stored events
- **WHEN** the frontend requests the run event history
- **THEN** the backend returns bounded ordered events with sequence numbers and safe payloads

#### Scenario: Client requests events after a cursor
- **WHEN** the frontend supplies a last-seen event sequence
- **THEN** the backend returns only later events when available

### Requirement: Run-specific SSE replays stored events
The run-specific review generation SSE SHALL replay stored events before tailing live events.

#### Scenario: Client reconnects to a running run
- **WHEN** the frontend opens the run stream after events already exist
- **THEN** the backend emits stored events in order and then continues sending new live events

#### Scenario: Client reconnects to a completed run
- **WHEN** the frontend opens the run stream after terminal completion
- **THEN** the backend replays stored events including the terminal event and then closes the stream

### Requirement: Streaming payloads remain safe
Persisted and replayed stream payloads SHALL exclude unsafe diagnostics and unbounded source content.

#### Scenario: Provider or prompt data exists
- **WHEN** a run event is stored or replayed
- **THEN** prompts, secrets, provider raw traces, private URLs, and unbounded OCR text are omitted or replaced with safe summaries
