# Design

## Context

Current state after run persistence:

```text
Frontend loading flow
  -> create review generation run
  -> subscribe to replayable SSE
  -> recover with status/events

Node BFF
  -> persisted run store
  -> in-process async execution started by run creation
  -> appends events to run store

Future target
  -> queue/workflow runtime
  -> Python worker/agent service
```

The run store now gives us a durable event and status surface. The missing boundary is a queue contract that separates "a run exists" from "some worker owns the work right now."

## Recommended Slice

Use a file-backed local development queue adapter first:

```text
POST /api/review-agent/generation-runs
  -> create persisted run
  -> enqueue review-generation job
  -> return run/status/events/stream URLs

Local worker loop
  -> claim due queued job
  -> mark leased + heartbeat
  -> execute existing generation pipeline
  -> append run events
  -> complete or fail/retry job

Future Python worker
  -> claim/heartbeat/append/complete through same contract
```

This avoids a premature infrastructure dependency while still forcing the production-shaped concepts into the codebase.

## Queue Model

Each job should be schema-versioned and safe:

- `schemaVersion`
- `jobId`
- `jobType`: initially `review-generation`
- `runId`
- `taskId`
- `status`: `queued | leased | running | succeeded | retryable_failed | dead_lettered | canceled`
- `priority`
- `attempt`
- `maxAttempts`
- `availableAt`
- `createdAt`
- `updatedAt`
- `leasedAt`
- `leaseExpiresAt`
- `workerId`
- `heartbeatAt`
- `completedAt`
- `failedAt`
- `safePayloadSummary`
- `safeError`

The job payload should not store unbounded document text, prompts, provider traces, secrets, or private URLs. If execution needs run input, the worker should read the persisted run record and use the bounded input already accepted by the run store.

## Queue Interface

Backend queue module should expose a small interface:

- `enqueueReviewGenerationJob({ runId, taskId, priority })`
- `getQueueStatus()`
- `getQueueJob(jobId)`
- `claimNextJob({ workerId, leaseMs })`
- `heartbeatJob(jobId, workerId)`
- `completeJob(jobId, workerId, summary)`
- `failJob(jobId, workerId, error)`
- `requeueExpiredLeases(now)`

This interface can later be implemented by Redis, PostgreSQL, or a workflow engine.

## Execution Semantics

Local development worker loop:

1. Starts with the Node BFF.
2. Periodically requeues expired leases.
3. Claims one due job at a time.
4. Marks the job running and emits safe run events through the existing run store.
5. Heartbeats while the job is active.
6. Completes the job when run terminal event is written.
7. On failure, retries until `maxAttempts`; then marks `dead_lettered` and records safe run failure.

The loop should be conservative: bounded concurrency of 1 by default, small lease timeout, safe summaries only.

## API Contract

Add development diagnostics endpoints:

- `GET /api/review-agent/queue/status`
  - returns queue readiness, counts by status, active worker id, and oldest queued job age
- `GET /api/review-agent/queue/jobs/:jobId`
  - returns one safe job summary

Run creation response may include:

- `jobId`
- `queueStatus`

These fields are optional for current frontend consumers.

## Frontend Strategy

No major UI change is required in this slice.

Frontend can optionally read queue health for the backend connectivity panel and debugging surfaces. Loading pages should continue to use run status/events/SSE as their primary recovery contract. Queue details are backend diagnostics, not a user-facing review workflow dependency yet.

## Safety

- Strip unsafe keys and unsafe values before persisting jobs.
- Store only bounded summaries for payload and errors.
- Never persist raw prompts, provider raw traces, private object URLs, API keys, tokens, or unbounded OCR text.
- Job diagnostics should be useful for recovery without exposing sensitive content.

## Risks

- File-backed leases are not safe for multiple Node processes; this is explicitly local development only.
- In-process worker execution still dies if the Node process exits; the queue state makes it recoverable on next start, but not continuously durable like a production worker.
- Adding queue state without changing the frontend may feel invisible; diagnostics endpoints and specs make the boundary clear.
- Queue retry can duplicate completion unless run terminal state remains idempotent; workers must check terminal run status before executing.
