# Review workbench view context

## Why

The workbench now restores section and paragraph context from the review session, but the exact active issue focus is still page-local. When a reviewer refreshes or reopens the task, the session should remember which issue was being inspected so the workbench resumes at the same point.

## What Changes

- Persist the workbench view context on the review task aggregate.
- Restore the active issue focus from the session snapshot when reopening the workbench.
- Keep the existing section and paragraph restoration behavior unchanged.

## Non-goals

- No change to review decisions or issue status rules.
- No new navigation pages.
- No backend API redesign.

## Impact

- `src/ReviewWorkbenchPage.tsx`
- `src/App.tsx`
- `src/domain/reviewSessionService.ts`
- `src/domain/reviewTypes.ts`
- `openspec/specs/review-session-state/spec.md`
- `openspec/specs/review-workbench/spec.md`
