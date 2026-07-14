# review-streaming-api Specification

## Purpose

Add a backend-owned review generation run bridge that can create a run with safe input, stream run-specific progress, and return a completion payload for frontend session persistence.

## Requirements

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
