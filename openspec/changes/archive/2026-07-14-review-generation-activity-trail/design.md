# Design

## Context

Current task state keeps the latest generation run:

```text
ReviewTask
  reviewGenerationRun        latest state only
  preparationPackage         latest preparation package
  draftIssueGenerationSnapshot
  issues
```

This is enough to decide whether the workbench can open, but not enough to explain the lifecycle after retries or degraded recovery.

The next slice adds an append-only safe trail:

```text
ReviewGenerationActivity[]
  id
  type
  occurredAt
  runId
  stage?
  status?
  message?
  packageId?
  draftIssueGenerationRunId?
  issueCount?
```

## Proposed Domain Shape

Add `ReviewGenerationActivity`:

- `id`
- `type`:
  - `run-started`
  - `stage-updated`
  - `package-persisted`
  - `draft-issues-generated`
  - `run-ready`
  - `run-degraded`
  - `run-failed`
  - `run-retried`
- `occurredAt`
- `runId`
- `stage?`: safe active stage metadata
- `status?`
- `message?`
- `preparationPackageId?`
- `draftIssueGenerationRunId?`
- `issueCount?`

Add optional `reviewGenerationActivities?: ReviewGenerationActivity[]` to `ReviewTask` and `ReviewSession`.

## Append Strategy

Service helpers should append activity events at the same boundary where state changes already happen:

- `startReviewGenerationRun`: append `run-started`; if previous terminal run exists, append `run-retried`.
- `updateReviewGenerationRunStage`: append `stage-updated`, but avoid excessive duplicates by only appending when stage index/type/paragraph context changes.
- `updateReviewTaskPreparationPackage`: append `package-persisted`.
- `mergeGeneratedReviewIssues`: append `draft-issues-generated`, then `run-ready` or `run-degraded`.
- `failReviewGenerationRun`: append `run-failed`.

This keeps activity creation centralized in the session service instead of page components.

## Safety Rules

Activity messages must be safe summaries only:

- allowed: stable status codes, short non-secret messages, counts, ids, stage metadata
- disallowed: prompts, provider raw traces, API keys, tokens, private object URLs, raw OCR text, raw document paragraphs

When unsure, store a high-level status and omit the message.

## UI Presentation

The UI should show a compact recent-activity summary:

- document card can show latest activity label
- loading page can show recent generation events
- workbench/detail can later show a fuller "review record" panel

This slice should avoid a full audit-log page. It only needs enough visibility to support recovery and reviewer trust.

## Compatibility

Older tasks may lack `reviewGenerationActivities`. Consumers must treat absence as an empty trail.

The activity trail is a local aggregate-level precursor to a backend audit log, not a final compliance log.

## Risks

- Activity logs can grow. Keep this MVP trail bounded or compact if necessary.
- Duplicating every progress tick can be noisy. Append meaningful changes only.
- Unsafe diagnostics must be filtered before persistence.
