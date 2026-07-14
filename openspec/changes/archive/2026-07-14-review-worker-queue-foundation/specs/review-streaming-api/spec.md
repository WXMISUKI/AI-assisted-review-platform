# review-streaming-api Specification

## Purpose

Keep run streaming and replay stable while generation execution moves behind a queue-backed worker boundary.

## Requirements

### Requirement: Run creation exposes queue metadata
The backend run creation response SHALL optionally expose safe queue metadata for the enqueued review-generation job.

#### Scenario: Job is enqueued
- **WHEN** a review generation run is created successfully
- **THEN** the response can include job id, queue status summary, and the existing run status/events/stream URLs

#### Scenario: Queue metadata is ignored
- **WHEN** a legacy frontend consumer only reads run id and stream URL
- **THEN** run creation remains compatible and the consumer can continue subscribing to run events

### Requirement: Queue-backed runs still stream through run events
The run-specific SSE contract SHALL remain based on persisted run events rather than queue internals.

#### Scenario: Worker emits progress
- **WHEN** a worker processes a queued generation job
- **THEN** clients receive progress through the existing run event replay and run-specific SSE contract

#### Scenario: Job retries
- **WHEN** a job is retried after a lease expiry or retryable failure
- **THEN** the stream exposes safe run progress and diagnostics without requiring clients to subscribe to queue-specific transport

### Requirement: Queue diagnostics are safe
The backend SHALL expose queue diagnostics without leaking unsafe job payload data.

#### Scenario: Client reads queue status
- **WHEN** a client requests queue status
- **THEN** the backend returns readiness, counts by status, active worker summary, and oldest queued age without raw payloads, prompts, secrets, provider traces, or private URLs
