## 1. Spec and Contract

- [x] 1.1 Extend `review-agent-orchestration` with backend-owned generation run persistence and replay requirements.
- [x] 1.2 Extend `review-streaming-api` with run status, event history, and replayable SSE requirements.
- [x] 1.3 Extend `review-session-state` with run replay recovery and duplicate-completion protection requirements.
- [x] 1.4 Extend `local-development-runtime` with file-backed run store expectations and limitations.

## 2. Backend Run Store

- [x] 2.1 Add a review generation run store interface for create, read, update status, append events, list events, and complete/fail operations.
- [x] 2.2 Implement a file-backed development adapter with schema version, bounded runs, bounded events per run, and safe empty-store behavior.
- [x] 2.3 Add sanitization for unsafe run fields, diagnostics, provider summaries, URLs, prompts, and unbounded document text.
- [x] 2.4 Add monotonic event sequence assignment per run.

## 3. Backend API and Runner

- [x] 3.1 Update run creation to persist a run record and return `statusUrl`, `eventsUrl`, and replayable `streamUrl`.
- [x] 3.2 Add `GET /api/review-agent/generation-runs/:runId` for safe run status recovery.
- [x] 3.3 Add `GET /api/review-agent/generation-runs/:runId/events` for bounded event replay.
- [x] 3.4 Update run-specific SSE to replay stored events before live events.
- [x] 3.5 Decouple run execution from a single SSE request enough that status/events remain recoverable after stream interruption.
- [x] 3.6 Preserve the legacy `/api/review-agent/stream` connectivity endpoint.

## 4. Frontend Recovery Integration

- [x] 4.1 Add backend connectivity helpers for generation run status and event history.
- [x] 4.2 Update the review-loading run bridge to tolerate stream interruption by fetching status/events.
- [x] 4.3 Ensure replayed completion events do not merge generated draft issues twice for the same run.
- [x] 4.4 Keep existing local fallback behavior when run creation, status, events, or SSE replay are unavailable.

## 5. Compatibility and Documentation

- [x] 5.1 Keep document library, locked loading, workbench unlock, retry, and result preview behavior unchanged.
- [x] 5.2 Document that file-backed run persistence is a development bridge, not a production queue.
- [x] 5.3 Ensure run records only contain safe summaries and references needed by future worker/Python services.

## 6. Verification and Archive

- [x] 6.1 Run `npm run typecheck`.
- [x] 6.2 Run `node --check` on changed backend `.mjs` files.
- [x] 6.3 Smoke check run creation, status read, event list, replayable SSE, and unsafe field stripping.
- [x] 6.4 Sync main specs and archive the completed OpenSpec change after implementation.
