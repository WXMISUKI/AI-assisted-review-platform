# Review workbench session focus

## Why

The workbench already restores section and paragraph context from the review session snapshot, but the active issue selection still defaults to the first issue. That makes reopened tasks feel slightly detached from the exact review point the session had reached.

## What Changes

- Restore the active issue focus from the session snapshot when possible.
- Prefer the current paragraph's issue, then the current section's issue, before falling back to the first issue.
- Keep the rest of the workbench behavior unchanged.

## Non-goals

- No new navigation model.
- No changes to issue editing or completion rules.
- No backend API changes.

## Impact

- `src/ReviewWorkbenchPage.tsx`
- `openspec/specs/review-workbench/spec.md`
