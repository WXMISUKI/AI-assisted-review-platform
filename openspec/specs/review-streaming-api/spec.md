# review-streaming-api Specification

## Purpose
TBD - created by archiving change backend-connectivity-and-agent-adapter-foundation. Update Purpose after archive.
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

### Requirement: Server-sent review events
The backend SHALL provide a server-sent events endpoint for review-agent connectivity testing.

#### Scenario: Client subscribes
- **WHEN** a client connects to the streaming endpoint
- **THEN** the backend sends text/event-stream headers and emits JSON review events

#### Scenario: Stream completes
- **WHEN** the backend finishes the deterministic connectivity stream
- **THEN** it sends a completion event and closes the connection

### Requirement: Enriched review progress events
The backend SHALL expose review progress events that can identify the current stage, current paragraph or section, and active agent role.

#### Scenario: Client subscribes to review progress
- **WHEN** a client connects to the review streaming endpoint
- **THEN** the backend can emit JSON events that include stage id, stage title, stage progress, current paragraph metadata, and issue summaries

#### Scenario: Client subscribes with structure summary
- **WHEN** a client connects to the review streaming endpoint with section and paragraph summary metadata
- **THEN** the backend can emit review-preparation events whose stage metadata reflects the supplied recovered-structure summary

#### Scenario: Client subscribes without structure summary
- **WHEN** a legacy client connects without structure metadata
- **THEN** the backend continues to emit deterministic connectivity events with backward-compatible basic progress fields

#### Scenario: Review progress reaches a ready state
- **WHEN** the pipeline completes
- **THEN** the backend emits a completion event and closes the connection

### Requirement: Structure-aware review-agent SSE
The backend SHALL allow the review-agent SSE endpoint to emit structure-aware stage summaries when section and paragraph context metadata is provided.

#### Scenario: Structure metadata is supplied
- **WHEN** a client connects to the review-agent stream endpoint with section and paragraph summary metadata
- **THEN** the backend emits stage events whose issue summaries and current location fields reflect the supplied recovered-structure context

#### Scenario: Structure metadata is absent
- **WHEN** a legacy client connects without structure metadata
- **THEN** the backend continues to emit the deterministic connectivity sequence with the existing stage and issue summary fallback

### Requirement: Stream contract remains backward compatible
The review stream SHALL continue to support simple progress consumers while adding richer stage metadata.

#### Scenario: A legacy consumer reads the stream
- **WHEN** a consumer only understands basic progress and issue summaries
- **THEN** the enriched stream still conveys usable progress without requiring bidirectional transport

### Requirement: Review-loading SSE consumption
The backend review-agent SSE contract SHALL remain consumable as a review-loading progress source before the workbench unlocks.

#### Scenario: Loading view subscribes with structure context
- **WHEN** the loading flow subscribes with recovered section and paragraph metadata
- **THEN** the emitted stage events can be used to advance loading progress and unlock the review-ready state

#### Scenario: Loading view cannot use SSE
- **WHEN** the loading flow does not have structure metadata or the stream cannot be established
- **THEN** the client can fall back to the local mock loading stages without breaking the contract

### Requirement: Package-shaped review completion
The backend review-agent stream SHALL emit package metadata on completion when recovered-structure context is supplied.

#### Scenario: Structure-aware stream completes
- **WHEN** the client subscribes to the review-agent stream with recovered section and paragraph metadata
- **THEN** the final completion event includes package metadata containing source, status, structure summary, stage events, issue summaries, provider summary, and completion time

#### Scenario: Legacy stream completes
- **WHEN** the client subscribes without recovered-structure metadata
- **THEN** the backend continues to emit the existing connectivity-oriented completion event without requiring package consumers

### Requirement: Safe preparation package metadata
The review-agent stream SHALL only expose safe provider and preparation metadata.

#### Scenario: Provider status is included
- **WHEN** package metadata includes provider readiness
- **THEN** it does not expose API keys, object-storage credentials, raw tokens, or private document URLs

#### Scenario: Stream cannot prepare a package
- **WHEN** structure context is missing or invalid
- **THEN** the client can fall back to local review-preparation stages without treating the stream as a failed review task

### Requirement: Review generation run creation
The backend SHALL expose a review generation run creation endpoint for bounded review-loading inputs.

#### Scenario: Client creates a generation run
- **WHEN** the frontend submits task id, review mode, recovered structure summary, paragraph excerpts, and max issue count
- **THEN** the backend returns a run id, initial status, and stream URL for the run-specific SSE endpoint

#### Scenario: Run input is unsafe or too large
- **WHEN** submitted paragraphs or metadata exceed accepted bounds
- **THEN** the backend truncates or rejects the unsafe fields with a safe error response without storing prompts, secrets, private URLs, or unbounded OCR text

### Requirement: Run-specific review generation SSE
The backend SHALL expose an SSE endpoint scoped to a review generation run id.

#### Scenario: Client subscribes to a valid run
- **WHEN** the frontend opens the run stream URL
- **THEN** the backend emits ordered review events for connection, preparation stages, draft issue generation, and terminal completion

#### Scenario: Client subscribes to an expired or missing run
- **WHEN** the run id is not found or expired
- **THEN** the backend emits or returns a safe not-found/expired state that lets the frontend use its fallback path

### Requirement: Completion payload includes package and draft issues
The run-specific stream SHALL emit a safe completion payload that contains the generated preparation package and draft issue generation result when available.

#### Scenario: Generation completes with usable candidates
- **WHEN** preparation and draft issue generation succeed
- **THEN** the completion event includes run id, ready status, completion time, preparation package, and draft issue generation output

#### Scenario: Draft issue generation falls back
- **WHEN** the draft issue adapter uses deterministic fallback or returns no candidates
- **THEN** the completion event includes degraded status, preparation package, safe diagnostics, and any fallback issue output

### Requirement: Existing stream remains compatible
The existing review-agent connectivity stream SHALL remain available for legacy consumers and the connectivity panel.

#### Scenario: Legacy stream consumer connects
- **WHEN** a client uses `/api/review-agent/stream`
- **THEN** it continues to receive the existing backward-compatible review preparation events without requiring a generation run id
