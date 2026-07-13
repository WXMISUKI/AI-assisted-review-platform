# review-streaming-api Specification

## Purpose
TBD - created by archiving change backend-connectivity-and-agent-adapter-foundation. Update Purpose after archive.
## Requirements
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
