# Review generation run state

## Why

The platform now has the pieces needed to turn OCR-derived structure into review-preparation packages, generate draft issues, persist generation provenance, and unlock the review workbench. However, the overall review generation run is still implicit in page flow and scattered snapshots.

This makes the next backend integration step fragile: after refresh or reopen, the UI can restore pipeline and generation artifacts, but it does not have a single task-level run state that says whether review generation is idle, running, completed, degraded, or failed. Future async workers, queues, and backend task records need this contract before we keep expanding provider behavior.

## What Changes

- Add a review generation run snapshot to the review task aggregate.
- Normalize run lifecycle states for review preparation and draft issue generation.
- Record safe timestamps, stage summaries, preparation package id, draft issue generation run id, and non-secret failure/degraded diagnostics.
- Use the run snapshot as the workbench unlock/reopen decision source where possible.
- Keep existing preparation package, pipeline snapshot, and draft issue generation snapshot contracts intact.

## Non-goals

- No real database, queue, or worker implementation.
- No new LLM prompt or OCR provider behavior.
- No full audit-log system.
- No report generation changes.
- No redesign of the review workbench.

## Impact

- `src/domain/reviewTypes.ts`
- `src/domain/reviewSessionService.ts`
- `src/domain/reviewTaskOrchestration.ts`
- `src/App.tsx`
- `src/appShellPages.tsx`
- `openspec/specs/review-session-state/spec.md`
- `openspec/specs/review-agent-orchestration/spec.md`
- `openspec/specs/review-workbench/spec.md`
