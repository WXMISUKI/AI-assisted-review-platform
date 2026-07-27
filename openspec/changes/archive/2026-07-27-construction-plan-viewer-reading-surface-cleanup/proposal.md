## Why

The viewer-first MVP is usable, but selecting text to create a manual annotation still re-enters the legacy paragraph/context path. That path can restore the previous active issue and scroll the page away from the newly selected source location. The detail page also still exposes a paragraph fallback view and a heuristic chapter tree that do not match the source-faithful viewer.

For the fastest production-oriented cleanup, the detail page should become a focused two-column review surface: source-faithful viewer plus issue workflow. The recovered structure remains available to the review engine and persistence layer, but unreliable chapter navigation and paragraph fallback UI should no longer compete with the viewer.

## What Changes

- Fix viewer-side selection context so creating a manual issue does not restore or scroll to the previous active issue.
- Stop persisting the previous active issue while a new viewer selection is only a draft.
- Remove the automatic issue-card scroll after creating a viewer-side manual issue.
- **BREAKING UI** Remove the paragraph fallback/debug view from the review detail page.
- **BREAKING UI** Remove the heuristic “方案章节” outline panel from the review detail page.
- Reflow the detail page into a viewer-first two-column layout with the issue list beside it.
- Keep recovered sections, paragraphs, `reviewEligible`, and issue anchors as internal compatibility data.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `review-workbench`: the detail page becomes a two-column viewer-first review surface without paragraph fallback or heuristic chapter navigation.

## Impact

- Frontend detail page: `src/ReviewWorkbenchPage.tsx`
- Frontend layout styles: `src/styles.css`
- Review view-context persistence: existing `updateReviewTaskViewContext` call path
- No new dependency, backend API, or persisted schema migration.
