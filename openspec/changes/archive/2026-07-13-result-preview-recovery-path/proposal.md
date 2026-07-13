# Result preview recovery path

## Why

The result preview now has a safe fallback shell, but it still does not explain where its data came from or offer a direct path back into the workbench for recovery. That makes it harder to debug missing-result cases and less helpful for users who need to inspect the underlying task state.

## What Changes

- Show the result source provenance in the result preview.
- Provide a direct way to reopen the review workbench from the result page.
- Keep the current result preview behavior unchanged when a result asset exists.

## Non-goals

- No backend API changes.
- No change to result asset generation.
- No rewrite of the result preview layout.

## Impact

- `src/App.tsx`
- `src/appShellPages.tsx`
- `openspec/specs/review-completion-results/spec.md`
