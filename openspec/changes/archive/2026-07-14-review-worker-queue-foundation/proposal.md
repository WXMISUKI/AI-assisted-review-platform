# Review worker queue foundation

## Why

The platform now has backend-owned task snapshots and replayable review generation run events. That closes the most urgent persistence gap, but run execution is still started directly inside the Node BFF process when a run is created. This remains too tightly coupled for a mature review workflow:

- the BFF still owns execution timing instead of handing work to a worker boundary;
- retry and lease semantics are not explicit;
- future Python workers have no stable claim/heartbeat/complete contract;
- queue health cannot be surfaced independently from provider health;
- failed or interrupted work cannot be reasoned about as queued, leased, retryable, dead-lettered, or terminal.

The next slice should introduce a small, durable worker-queue contract behind the existing Node BFF without jumping straight to Redis, Celery, BullMQ, Temporal, or Python. This gives the project a stable execution boundary that can later be backed by a real queue and Python agent service.

## What Changes

- Add a backend worker queue contract for review generation jobs.
- Add a file-backed local development queue adapter with bounded jobs, leases, retry counts, and safe payload summaries.
- Change review generation run creation so it enqueues a review-generation job instead of directly owning the execution path.
- Add a local in-process worker loop that claims due jobs, heartbeats during execution, updates the existing run store, and completes/fails jobs.
- Add queue status and job read endpoints for development diagnostics.
- Keep existing run status, event replay, SSE, and frontend fallback behavior unchanged.
- Document the boundary that future Python workers will implement: claim, heartbeat, append event/update run, complete, fail, retry.

## Non-goals

- No Redis/BullMQ/Celery/Temporal production queue in this change.
- No separate Python worker service in this change.
- No PostgreSQL schema migration in this change.
- No multi-worker distributed locking guarantee beyond local development leases.
- No auth/tenant permission model yet.
- No change to user-facing review decisions, workbench behavior, or result preview behavior.

## Impact

- new backend queue module under `server/`
- `server/reviewGenerationRunBridge.mjs`
- `server/reviewGenerationRunStore.mjs` only if job metadata references are needed
- `server/index.mjs`
- `src/domain/backendConnectivity.ts`
- connectivity/status surfaces that expose backend readiness
- `docs/architecture-evolution-decisions.md`
- `openspec/specs/review-agent-orchestration/spec.md`
- `openspec/specs/review-streaming-api/spec.md`
- `openspec/specs/review-session-state/spec.md`
- `openspec/specs/local-development-runtime/spec.md`
- `openspec/specs/backend-connectivity/spec.md`
