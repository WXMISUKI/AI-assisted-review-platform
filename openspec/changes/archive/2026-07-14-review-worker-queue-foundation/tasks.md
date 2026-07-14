## 1. Spec and Contract

- [x] 1.1 Extend `review-agent-orchestration` with queued review-generation job lifecycle requirements.
- [x] 1.2 Extend `review-streaming-api` with queue-backed run creation and unchanged run event replay behavior.
- [x] 1.3 Extend `review-session-state` with idempotent terminal run handling when jobs retry.
- [x] 1.4 Extend `local-development-runtime` with file-backed queue adapter expectations and limitations.
- [x] 1.5 Extend `backend-connectivity` with safe queue readiness diagnostics.

## 2. Backend Queue Store

- [x] 2.1 Add a review worker queue module with enqueue, claim, heartbeat, complete, fail, retry, and status operations.
- [x] 2.2 Implement a file-backed local development adapter with schema version, bounded jobs, safe empty-store behavior, and counts by status.
- [x] 2.3 Add lease and retry semantics: `availableAt`, `leaseExpiresAt`, `attempt`, `maxAttempts`, and dead-letter behavior.
- [x] 2.4 Add sanitization for job payload summaries, worker metadata, errors, provider diagnostics, URLs, prompts, and unbounded source content.

## 3. Local Worker Loop

- [x] 3.1 Add a local review-generation worker loop that starts with the backend BFF in development mode.
- [x] 3.2 Claim queued review-generation jobs with a bounded concurrency of one.
- [x] 3.3 Execute the existing review-generation pipeline through the persisted run/event store.
- [x] 3.4 Heartbeat active jobs and requeue expired leases.
- [x] 3.5 Mark jobs succeeded, retryable failed, or dead-lettered with safe summaries.
- [x] 3.6 Ensure workers skip execution when the associated run is already terminal.

## 4. Backend API Integration

- [x] 4.1 Update generation run creation to enqueue a review-generation job and return optional `jobId` and queue summary.
- [x] 4.2 Add `GET /api/review-agent/queue/status` for safe queue diagnostics.
- [x] 4.3 Add `GET /api/review-agent/queue/jobs/:jobId` for safe job summary reads.
- [x] 4.4 Keep existing run status, events, and replayable SSE endpoints compatible.
- [x] 4.5 Preserve legacy `/api/review-agent/stream` connectivity behavior.

## 5. Frontend Diagnostics and Compatibility

- [x] 5.1 Add backend connectivity helper types and functions for queue status.
- [x] 5.2 Surface queue readiness in the existing backend connectivity/status summary without making it a user workflow dependency.
- [x] 5.3 Keep document library, loading flow, workbench unlock, retry, and result preview behavior unchanged.
- [x] 5.4 Keep local fallback behavior when queue diagnostics or enqueue fields are unavailable.

## 6. Documentation, Verification, and Archive

- [x] 6.1 Update architecture decisions to record the local queue adapter as the next bridge toward Python workers.
- [x] 6.2 Run `npm run typecheck`.
- [x] 6.3 Run `node --check` on changed backend `.mjs` files.
- [x] 6.4 Smoke check enqueue, claim/execute, queue status, run event replay, retry/dead-letter assumptions, and unsafe field stripping.
- [x] 6.5 Sync main specs and archive the completed OpenSpec change after implementation.
