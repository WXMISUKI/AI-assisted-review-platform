# Design

## Context

Current execution shape:

```text
Frontend loading flow
  -> create review generation run
  -> subscribe to replayable SSE / poll status and events

Node BFF
  -> persisted run store
  -> local file-backed worker queue
  -> local worker loop
  -> in-process review generation pipeline
```

Target bridge shape:

```text
Node worker loop
  -> review agent service adapter
       -> configured Python agent service when ready
       -> local Node fallback when unavailable, timed out, or invalid
  -> persisted run records/events
  -> existing SSE replay surface
```

The bridge is intentionally backend-facing. The frontend should continue to treat run status and events as the source of truth.

## Agent Service Readiness

Configuration should be server-side only:

- `AGENT_SERVICE_BASE_URL`
- `AGENT_SERVICE_TIMEOUT_MS`
- optional future auth fields, never exposed directly

The backend health/connectivity summary should expose only safe fields:

- `configured`
- `ready`
- `status`: `ready | degraded | unavailable | disabled`
- `source`: `python-agent-service | local-fallback`
- `summary`
- bounded `diagnostics`

It must not expose private base URLs, headers, tokens, prompts, provider traces, raw OCR text, or document object URLs.

## Invocation Contract

The adapter should define a stable review-generation request:

- `schemaVersion`
- `runId`
- `taskId`
- `mode`
- `structureSummary`
- `preparationPackageSummary`
- bounded `paragraphExcerpts`
- `maxIssues`
- safe provider readiness summaries
- optional `traceContext` with non-secret ids only

The adapter should define a stable response:

- `ok`
- `source`: `python-agent-service | local-fallback`
- `status`: `ready | degraded | failed`
- `stageEvents`
- `preparationPackage`
- `draftIssueGeneration`
- `diagnostics`
- `completedAt`

`stageEvents` must be safe for persistence and SSE replay. It should contain bounded stage id/title/progress/payload summaries, not raw prompts or unbounded text.

## Adapter Behavior

Execution preference:

1. If the agent service is not configured, use local fallback.
2. If configured, check cached or fresh readiness within a bounded timeout.
3. If ready, call the service with a sanitized bounded payload.
4. If the call fails, times out, or returns invalid schema, record safe diagnostics and fall back locally.
5. If the service returns a valid degraded result, preserve it as degraded rather than hiding it as local fallback.

The bridge should be idempotent with the existing run lifecycle. The queue worker still owns job claim, heartbeat, retry, and terminal job state. The adapter only decides how the run's generation work is executed.

## API Shape

Suggested Python service endpoints for the contract:

- `GET /health`
- `POST /review-generation`

The Node BFF does not need to expose these endpoints to the browser. It only surfaces safe readiness and run lifecycle events.

## Frontend Compatibility

No new user workflow is required in this slice.

The backend connectivity panel may show an additional agent service readiness row. Review loading, retry, recovery, result preview, and workbench unlock should continue to use generation run status/events.

## Safety

- Bound excerpt counts and excerpt length before sending bridge payloads.
- Strip secrets, prompts, raw provider traces, private URLs, and unbounded document text.
- Treat external agent service responses as untrusted input and validate before storing or streaming.
- Store only safe diagnostics with source/status/message and bounded metadata.

## Risks

- A bridge without a real Python service can look abstract; keeping local fallback wired through the same adapter makes the contract testable.
- Silent fallback could hide integration problems; diagnostics should clearly report `source` and fallback reason.
- Agent responses may drift from the expected schema; runtime validation and safe degraded behavior are required.
