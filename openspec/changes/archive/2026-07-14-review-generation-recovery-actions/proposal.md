# Review generation recovery actions

## Why

The task aggregate now stores a review generation run snapshot with `running`, `ready`, `degraded`, and `failed` states. The UI can summarize those states, but a failed generation run still has no clear recovery action in the document library or orchestration contract.

Before adding real async workers or backend task persistence, failed and degraded generation states need safe, predictable user behavior: failed tasks should be retryable, degraded tasks should remain reviewable, and retrying should start a fresh generation attempt without leaking prior provider diagnostics into the next run.

## What Changes

- Add recovery-action requirements for failed and degraded review generation runs.
- Make generation retry start a fresh run snapshot while preserving existing safe task history.
- Surface a retry action in the document library for failed review generation tasks.
- Keep degraded tasks openable in the workbench and show them as reviewable rather than failed.
- Preserve legacy status behavior for tasks without a generation run snapshot.

## Non-goals

- No queue, worker, or backend retry endpoint.
- No provider prompt or OCR behavior changes.
- No destructive deletion of previous issues or result assets.
- No new modal flow or large UI redesign.

## Impact

- `src/domain/reviewSessionService.ts`
- `src/domain/reviewTaskOrchestration.ts`
- `src/appShellPages.tsx`
- `src/App.tsx`
- `openspec/specs/review-session-state/spec.md`
- `openspec/specs/review-workbench/spec.md`
