# Review generation task materialization

## Why

The platform now has durable review generation runs, replayable events, a worker queue, and an agent service bridge. That proves background review generation can continue after the frontend starts a run.

The remaining production gap is that generated preparation packages and draft issues are still primarily applied to the review task aggregate by the frontend after it consumes SSE completion. If the user leaves the loading page, refreshes at the wrong time, or another client opens the document later, the backend may have a completed run while the persisted review task has not yet been updated with reviewable issues.

The next highest-value slice is to let the backend materialize completed generation run output into the persisted review task aggregate. This makes the document library and workbench recover from backend-owned task state instead of relying on one browser session to apply completion.

## What Changes

- Add a backend materialization step after a review generation worker finishes a run.
- Read the terminal run event payload and update the matching review task snapshot with:
  - review-ready status;
  - preparation package summary;
  - generated draft issues;
  - draft issue generation snapshot;
  - generation run snapshot;
  - safe generation activity trail.
- Keep materialization idempotent by generation run id / draft issue generation run id.
- Preserve existing reviewer decisions, manual issues, result assets, OCR metadata, and source object metadata.
- Keep frontend SSE consumption compatible; frontend may still apply live completion, but backend task state becomes the recovery source.

## Non-goals

- No production database migration.
- No report generation/export in this slice.
- No permission/tenant model yet.
- No full audit log immutability yet.
- No new frontend workflow or visual redesign.
- No replacement of existing frontend live SSE update behavior.

## Direction Decision

Compared with continuing to optimize provider diagnostics, adding a full Python service, or starting reports, this slice gives the fastest path to a usable review platform:

1. It converts AI output into durable review work.
2. It makes background execution meaningful even when the browser disconnects.
3. It improves refresh/reopen behavior without requiring infrastructure changes.
4. It creates the foundation needed before report generation and audit hardening.

## Impact

- `server/reviewGenerationRunBridge.mjs`
- `server/reviewGenerationRunStore.mjs`
- `server/reviewTaskStore.mjs`
- new backend materialization helper under `server/`
- `src/domain/reviewTaskRepository.ts`
- `openspec/specs/review-session-state/spec.md`
- `openspec/specs/document-review-task/spec.md`
- `openspec/specs/review-issue-model/spec.md`
- `openspec/specs/review-agent-orchestration/spec.md`
