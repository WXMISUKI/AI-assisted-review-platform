# Result preview fallback shell

## Why

The completed-task result entry currently depends on a generated result asset being present. If the task is completed but the asset is missing or the session snapshot cannot be derived, the result route can collapse into a blank screen. That is fragile for recovery and awkward for support.

## What Changes

- Keep the result preview route open even when the result asset is unavailable.
- Render a safe fallback shell that explains the result is not ready yet.
- Preserve the existing result preview when the asset is present.

## Non-goals

- No new backend API.
- No new result asset schema.
- No change to completion generation logic.

## Impact

- `src/App.tsx`
- `src/appShellPages.tsx`
- `openspec/specs/review-completion-results/spec.md`
