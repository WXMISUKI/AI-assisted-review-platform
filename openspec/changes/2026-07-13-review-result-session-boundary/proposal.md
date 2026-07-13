# Review result session boundary continuity

## Why

The review session boundary already carries the loading and workbench entry state, but the result preview still depends on page-local document props. We already persist result assets on the review task aggregate, so the next clean step is to let the result page consume the same session contract.

## What Changes

- Extend the review session snapshot so it can carry a completed result asset.
- Let the app open the result preview through the same session boundary used for review detail.
- Keep the persisted review task aggregate as the fallback source of truth.

## Non-goals

- No new backend API.
- No redesign of the result preview UI.
- No change to the result asset schema.

## Impact

- `src/domain/reviewTypes.ts`
- `src/domain/reviewSessionService.ts`
- `src/App.tsx`
- `src/appShellPages.tsx`
- `openspec/specs/review-session-state/spec.md`
- `openspec/specs/review-completion-results/spec.md`
