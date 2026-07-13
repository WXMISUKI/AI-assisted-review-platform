# Review workbench session boundary handoff

## Why

The review-loading flow and pipeline snapshot now have a stable path, but the review workbench entry still reconstructs most of its initial state directly from page props. We already have a session service boundary that can assemble a normalized review session from the task aggregate, recovered structure, and issue anchors.

This change makes the workbench entry consume that session boundary so the app uses one shared source of truth for recovered paragraphs, rebounded issues, and the current review-preparation location.

## What Changes

- Build the review workbench entry from `createReviewSession(...)` instead of raw page-local state.
- Keep the current workbench interaction model intact.
- Use the session snapshot to initialize the active section / paragraph context more reliably.

## Non-goals

- No new backend API.
- No rewrite of the workbench interaction model.
- No change to result asset generation.

## Impact

- `src/App.tsx`
- `src/ReviewWorkbenchPage.tsx`
- `src/domain/reviewSessionService.ts`
- `openspec/specs/review-session-state/spec.md`
- `openspec/specs/review-workbench/spec.md`
