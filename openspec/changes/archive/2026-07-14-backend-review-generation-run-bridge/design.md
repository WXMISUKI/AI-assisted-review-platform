# Design

## Context

Current frontend flow:

```text
startReview()
  -> local startReviewGenerationRun()
  -> subscribeReviewStreamEvents(structureSummary)
  -> receive preparationPackage
  -> updateReviewTaskPreparationPackage()
  -> requestDraftIssueGeneration(preparationPackage, paragraphs)
  -> mergeGeneratedReviewIssues() or completeReviewGenerationRun(degraded)
```

This is intentionally incremental, but it means the page coordinates a backend workflow that should become server-owned. The new bridge introduces a backend run facade while keeping the existing frontend session aggregate.

## Proposed Flow

```text
Frontend
  POST /api/review-agent/generation-runs
    taskId
    mode
    structureSummary
    paragraphs[]  (bounded excerpts)
    maxIssues

Backend BFF
  create in-memory run
  return { ok, runId, streamUrl, status }

Frontend
  EventSource(streamUrl)

Backend SSE
  review.connection
  review.stage ... preparation events
  review.stage ... draft issue generation begins
  review.complete with:
    runId
    status: ready | degraded
    completedAt
    preparationPackage
    draftIssueGeneration
      source
      status
      issues
      diagnostics
      runId

Frontend
  update stream stage
  persist preparationPackage
  merge draft issues
  mark local run ready/degraded
  append existing activity trail through session service
```

## Backend Run Registry

The first slice can use an in-memory registry:

- key: backend generation run id
- value:
  - `runId`
  - `taskId`
  - `createdAt`
  - `expiresAt`
  - `mode`
  - `structureSummary`
  - bounded `paragraphs`
  - `maxIssues`

Retention should be short and bounded:

- cap paragraph count and text length, matching or stricter than current draft issue request limits
- expire runs after a small TTL such as 10 minutes
- remove a run after terminal streaming when possible
- return a safe `not_found` or `expired` event if the stream cannot find the run

This is a compatibility bridge, not durable job persistence.

## Event Contract

Run-specific SSE should preserve existing `ReviewStreamEvent` fields and add optional completion payload fields.

Required safe fields:

- `type`
- `stageId`
- `title`
- `detail`
- `progress`
- optional `stageType`
- optional `agentKey`
- optional paragraph/section metadata
- `issueSummaries`
- optional `runId`
- optional `status`
- optional `completedAt`
- optional `preparationPackage`
- optional `draftIssueGeneration`

No stream event may expose:

- raw prompts
- API keys or tokens
- provider raw traces
- private object URLs
- full raw OCR text beyond the bounded paragraph excerpts already sent for generation

## Draft Issue Generation Coupling

The stream should call the existing `generateDraftIssues` adapter after preparation package creation.

Outcomes:

- LLM candidates returned: emit completion with `status: ready`.
- deterministic fallback or no candidates: emit completion with `status: degraded`.
- adapter throws or times out: emit completion with `status: degraded` and safe diagnostics when a reviewable package exists.
- preparation cannot create a usable package: emit terminal failure event; frontend keeps retry path.

## Frontend Preference and Fallback

The loading flow should prefer:

1. `createReviewGenerationRun(...)`
2. run-specific SSE stream
3. completion payload containing preparation package and draft issues

Fallback remains:

1. existing `/api/review-agent/stream`
2. existing local preparation stages
3. existing `/api/review-agent/draft-issues`

The session service should remain the source of persistence semantics. Page code should map backend payloads into existing helpers rather than duplicating run/activity mutations.

## Compatibility

- Existing connectivity panel keeps using `/api/review-agent/stream`.
- Existing draft issue endpoint remains available.
- Older browser-stored tasks without backend run bridge metadata remain openable.
- The contract should be shaped so a future durable worker can replace the in-memory registry with the same `runId` and stream event model.

## Risks

- In-memory runs disappear on backend restart. This is acceptable for the bridge but must degrade safely.
- EventSource uses GET, so large payloads must be submitted through the creation POST rather than query params.
- The page should avoid double-generating issues when both the run stream and fallback endpoint produce output.
- Frontend must not persist unsafe backend diagnostics.
