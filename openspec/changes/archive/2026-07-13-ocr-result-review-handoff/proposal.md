# OCR result review handoff

## Why

The platform already submits OCR jobs and hydrates recovered structure for downstream review, but the review-loading path still does not make the hydration handoff explicit. Operators and reviewers need to see whether the task is advancing from OCR output, hydrated structure, or fallback recovery before the workbench unlocks.

## What Changes

- Surface OCR hydration provenance in the review-loading flow.
- Keep the hydrated recovered structure as the source of truth for the review-preparation handoff.
- Preserve a safe fallback path when OCR hydration cannot produce a usable structure.

## Non-goals

- No backend API redesign.
- No new document routes.
- No change to result export behavior.

## Impact

- `src/App.tsx`
- `src/appShellPages.tsx`
- `openspec/specs/review-session-state/spec.md`
- `openspec/specs/document-review-task/spec.md`
