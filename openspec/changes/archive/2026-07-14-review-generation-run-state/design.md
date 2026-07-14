# Design

## Context

Current flow:

```text
OCR hydration
  -> review-preparation stream/package
  -> draft issue generation
  -> draft issue generation snapshot
  -> workbench ready
```

The flow works, but the task aggregate does not yet expose one lifecycle record for the overall review generation run. The UI infers readiness from a mix of task status, pipeline snapshot, preparation package, and issue generation result.

The next slice should make the run itself explicit:

```text
ReviewGenerationRunSnapshot
  status: idle | running | ready | degraded | failed
  startedAt / completedAt
  activeStage
  preparationPackageId
  draftIssueGenerationRunId
  issueCount
  diagnostics
```

## Proposed Domain Shape

Add `ReviewGenerationRunSnapshot`:

- `runId`
- `status`: `idle | running | ready | degraded | failed`
- `startedAt`
- `updatedAt`
- `completedAt?`
- `activeStage?`
- `preparationPackageId?`
- `draftIssueGenerationRunId?`
- `generatedIssueCount`
- `diagnostics?`: safe status/message/source fields only

Add small service helpers rather than assembling this snapshot in React components:

- start or update a generation run when review preparation begins
- attach preparation package metadata when package persistence completes
- attach draft issue generation metadata when issue generation completes
- mark the run `ready`, `degraded`, or `failed` based on safe terminal state

## Lifecycle Semantics

Recommended status mapping:

- `idle`: task has not started review generation.
- `running`: review preparation or issue generation is in progress.
- `ready`: preparation completed and candidate generation completed without failure status.
- `degraded`: fallback or no-candidate generation completed, but the workbench can still open.
- `failed`: generation cannot produce a usable workbench state and should surface safe recovery UI.

`degraded` is important because provider failure should not automatically fail the review task when deterministic fallback or empty generation still leaves a reviewable document.

## Reopen and Unlock Rules

The workbench should prefer the generation run snapshot for entry decisions:

- `ready` and `degraded` can unlock the workbench.
- `running` stays in locked loading/detail observation.
- `failed` shows a safe failure state and available retry/fallback entry.
- absence of the snapshot falls back to existing task status behavior for backward compatibility.

## Compatibility

This change should not remove existing fields:

- `pipelineSnapshot` remains the stage-level UI progress source.
- `preparationPackage` remains the package payload for issue generation.
- `draftIssueGenerationSnapshot` remains the issue-generation provenance record.

The new snapshot ties those records together and becomes the future backend-replaceable task run contract.

## Risks

- Duplicating lifecycle state can cause drift. Keep updates centralized in session service helpers.
- `failed` must not be overused; fallback/no-candidate generation should normally be `degraded`.
- Diagnostics must stay safe and avoid prompts, secrets, provider traces, object URLs, and raw document text.
