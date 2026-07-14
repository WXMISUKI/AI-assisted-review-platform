# Design

## Context

Current background run path:

```text
Frontend starts review
  -> POST /api/review-agent/generation-runs
  -> backend creates run + enqueues job
  -> worker executes generation
  -> run store receives events and terminal completion
  -> frontend SSE handler applies completion to local task aggregate
  -> frontend best-effort syncs task aggregate to backend
```

Target recovery path:

```text
Worker executes generation
  -> run store receives terminal completion
  -> backend materializes completion into review task store
  -> frontend can later load persisted task with issues already present
```

The run/event store remains the generation execution source of truth. The review task store becomes the user workflow source of truth after materialization.

## Recommended Scope

Add a backend helper:

- `materializeReviewGenerationRunToTask(runId)`
- `materializeReviewGenerationFailureToTask(runId, error)`

The helper reads:

- the generation run record;
- stored run events;
- the matching review task snapshot.

It writes:

- task `status`;
- `preparationPackage`;
- `draftIssueGenerationSnapshot`;
- merged `issues`;
- `issueCount`;
- `reviewGenerationRun`;
- `reviewGenerationActivities`;
- safe `failure` only for unrecoverable terminal failure.

## Idempotency

Materialization must not duplicate generated issues or activity events.

Use stable keys:

- `draftIssueGeneration.runId`;
- `reviewGenerationRun.runId`;
- issue fingerprint: `finding.title | anchor.paragraphId | anchor.text`.

If a task already has `draftIssueGenerationSnapshot.runId` for the same draft run, the helper should still refresh safe run metadata but skip issue/activity duplication.

## Data Mapping

Terminal completion event:

- `preparationPackage` -> task `preparationPackage`
- `draftIssueGeneration.issues` -> task `issues`
- `draftIssueGeneration` -> task `draftIssueGenerationSnapshot`
- run status/progress/activeStage -> task `reviewGenerationRun`
- safe diagnostics/source/status -> task activity trail

Run status mapping:

- `ready` -> task status `ready`
- `degraded` -> task status `ready`, because degraded still means reviewable
- `failed` -> task status `failed` only when no reviewable package exists

## Frontend Compatibility

The frontend live SSE path can stay as-is. To improve reopen behavior without a UI rewrite:

- allow backend task cache refresh to overwrite local cache when backend returns task snapshots;
- continue preserving local fallback when backend is unavailable.

## Safety

- Reuse task store sanitization.
- Do not persist prompts, secrets, provider raw traces, private URLs, or unbounded raw OCR text.
- Bound activity trail and issue count through existing task store normalization.

## Risks

- Task snapshot may not exist when the worker completes if the browser has not synced it yet.
  - In this case materialization should no-op safely and keep run events recoverable.
- Backend and frontend might both apply the same completion.
  - Existing frontend idempotency plus backend issue fingerprints prevent duplication.
- Generated candidates might be invalid.
  - The draft issue adapter already validates candidates; materialization still drops structurally invalid issue objects.
