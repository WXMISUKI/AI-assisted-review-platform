# Design

## Context

Current run ownership:

```text
Frontend review loading flow
  -> POST /api/review-agent/generation-runs
  -> EventSource(run.streamUrl)

Node BFF
  -> reviewGenerationRunBridge
       -> in-memory Map
       -> emits stage events during one SSE request
       -> deletes run after completion

Review task persistence
  -> file-backed task snapshots
  -> best-effort frontend sync
```

This means a run is observable only through the active stream. Once the stream is gone, the backend has no durable run status or event history.

## Target Slice

Introduce a backend run store behind the Node BFF:

```text
Frontend loading flow
  -> create run
  -> subscribe to replayable SSE
  -> recover with status/events when needed
  -> existing local fallback remains

Node BFF
  -> reviewGenerationRunBridge
       -> reviewGenerationRunStore
            -> file-backed dev adapter
            -> later queue/PostgreSQL adapter
```

The development runner may still execute in-process. The important architectural shift is that run state and events are stored independently of a single browser connection.

## Backend Contract

Add or extend endpoints:

- `POST /api/review-agent/generation-runs`
  - creates a persisted run record
  - returns `runId`, `status`, `statusUrl`, `eventsUrl`, `streamUrl`, `createdAt`, and `expiresAt`
- `GET /api/review-agent/generation-runs/:runId`
  - returns safe run metadata, latest status, progress, active stage, terminal timestamps, and safe diagnostics
- `GET /api/review-agent/generation-runs/:runId/events`
  - returns a bounded list of stored safe events, optionally filtered by sequence cursor
- `GET /api/review-agent/generation-runs/:runId/stream`
  - replays stored events first, then tails live events while the run is active

The existing stream URL shape should remain compatible where possible.

## Run Snapshot Shape

The backend run record should be schema-versioned and bounded:

- `schemaVersion`
- `runId`
- `taskId`
- `mode`
- `status`: `created | running | ready | degraded | failed | expired`
- `createdAt`, `updatedAt`, `startedAt`, `completedAt`, `expiresAt`
- `progress`
- `activeStage`
- `structureSummary`
- `acceptedParagraphCount`
- `maxIssues`
- `preparationPackageSummary`
- `draftIssueGenerationSummary`
- `safeDiagnostics`
- `events`

Stored events should include:

- monotonic `sequence`
- `runId`
- `taskId`
- `type`
- `status`
- `stageId`
- `title`
- `detail`
- `progress`
- safe current section/paragraph metadata
- issue summaries
- event timestamp
- optional safe completion summaries

Do not persist raw prompts, API keys, provider traces, full OCR text, private object URLs, or arbitrary provider payloads.

## Execution Model

For this slice, an in-process runner is acceptable:

1. Run creation stores a `created` run.
2. The bridge starts a bounded async execution for that run.
3. Each meaningful stage appends a safe event to the run store and updates latest status.
4. SSE subscribers replay already stored events and then receive new events.
5. Terminal completion stores a final status and completion summary.

This is not a production queue. It is a replaceable bridge that creates the state shape future queue workers will update.

## Frontend Strategy

Keep the loading flow behavior familiar:

```text
create backend generation run
  -> subscribe to stream
  -> apply events to existing session state
  -> on stream interruption, fetch status/events
  -> if backend bridge cannot recover, use existing local fallback
```

The frontend should not need to know whether events came from immediate SSE emission or replay.

## Compatibility

- Existing `/api/review-agent/stream` remains available for connectivity and legacy fallback.
- Existing run-specific stream consumers keep receiving `review-event` event frames.
- Review task snapshots remain the source for document library/workbench state.
- Empty or unavailable run persistence must not erase existing local task state.
- File-backed run storage remains a development adapter only.

## Risks

- File writes can race under concurrent traffic; acceptable only for local development.
- In-process execution still stops if the Node process exits; production durability requires a real queue/worker later.
- Event history can grow; store bounded event lists and safe summaries only.
- Replaying completion events must not cause the frontend to duplicate issue merges for the same run.
