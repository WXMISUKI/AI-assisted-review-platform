# Review loading structure stage display

## Why

The loading flow already consumes recovered structure, pipeline snapshots, and backend SSE events, but the page render path still treats its visible stage as a mostly static template array. That means the user can have real recovered sections, paragraphs, and draft-issue signals in session state while the loading screen is still showing the generic fallback stage source.

We want the loading screen to speak the same language as the session and orchestration layers: if recovered structure exists, the page should render the structure-aware preparation stages that were derived from that task. If it does not, the page should continue to use the existing fallback stages.

## What Changes

- Make the review-loading screen render structure-aware preparation stages when recovered structure is available.
- Keep the fallback mock stage flow unchanged for tasks without recovered structure.
- Align the visible stage title, detail, outline, and issue summary source with the task's current review-preparation context.

## Non-goals

- No new backend endpoint.
- No change to the review workbench layout.
- No change to OCR polling behavior.

## Impact

- `src/App.tsx`
- `src/appShellPages.tsx`
- `openspec/specs/streaming-review-workbench/spec.md`
- `openspec/specs/document-review-task/spec.md`
