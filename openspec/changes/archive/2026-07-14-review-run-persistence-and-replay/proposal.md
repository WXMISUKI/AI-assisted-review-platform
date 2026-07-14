# Review run persistence and replay

## Why

The platform now has backend-owned review task snapshots, but review generation runs are still mostly transient. The current run bridge creates run metadata in memory, emits SSE events while a client is connected, and removes the run when the stream completes. That is useful for connectivity and MVP loading, but it cannot support mature review-platform expectations:

- users can leave and reopen the loading page without losing run context;
- the document library can show the latest run status without depending on one browser tab;
- future worker services need a stable run state and event contract to update;
- retries need idempotent run records instead of only fresh in-memory streams;
- loading events should be replayable for observation and recovery.

The next step is not a full production queue or Python worker. The next step is a backend-owned review generation run store and replayable event log behind the existing Node BFF. This keeps the current frontend contract recognizable while making the run lifecycle durable enough for the worker queue foundation.

## What Changes

- Add a backend review generation run persistence contract for run metadata, terminal state, safe diagnostics, and bounded event history.
- Replace the purely in-memory run map with a small store interface and file-backed development adapter.
- Let run creation return status, stream, and event replay URLs.
- Let the run-specific SSE endpoint replay stored events before tailing live updates.
- Add a run status/read endpoint so the frontend can recover loading state after refresh or stream interruption.
- Persist safe run progress events, completion payload summaries, preparation package references, draft issue generation summaries, and terminal timestamps.
- Keep unsafe values out of persisted run state: prompts, secrets, provider raw traces, private URLs, and unbounded document text.
- Keep the current local fallback path and review workbench behavior unchanged.

## Non-goals

- No Redis/BullMQ/Celery/Temporal implementation in this change.
- No Python worker service in this change.
- No production PostgreSQL schema migration in this change.
- No multi-tenant permission model yet.
- No immutable audit-log service yet.
- No full async refactor of the frontend session service.
- No attempt to make file-backed storage safe for production concurrency.

## Impact

- `server/reviewGenerationRunBridge.mjs`
- new backend review generation run store module under `server/`
- `server/index.mjs`
- `src/domain/backendConnectivity.ts`
- review-loading flow files that create generation runs and consume run SSE
- `openspec/specs/review-agent-orchestration/spec.md`
- `openspec/specs/review-streaming-api/spec.md`
- `openspec/specs/review-session-state/spec.md`
- `openspec/specs/local-development-runtime/spec.md`
