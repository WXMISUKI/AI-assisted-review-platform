## Why

The current platform shell can let main content height stretch the sidebar, the processed preview reads like stacked rows instead of a mature document review surface, and the review-loading flow hides the future AI review process instead of showing progressive workbench output. This change improves the MVP toward an enterprise document review platform without building a real backend.

## What Changes

- Fix the platform shell layout so the sidebar is viewport-bound and main content scrolls inside its own container.
- Restyle the processed preview into a document-like reading surface with stronger spacing, readable paragraphs, and better long-document containment.
- Replace the single loading card with a mock streaming review detail state that shows outline, document, and issues panels filling progressively.
- Document the production direction: long documents should use independent scroll regions with outline anchors, and future AI updates should use SSE/EventSource or WebSocket events.

## Capabilities

### New Capabilities
- `streaming-review-workbench`: Defines the in-detail AI processing state where outline, document, and issue panels can receive staged or incremental updates before the task is fully ready.

### Modified Capabilities
- `platform-shell`: Adds viewport-bounded shell scrolling behavior.
- `review-workbench`: Adds document-like processed preview requirements for long review content.
- `document-review-task`: Adds visible streaming progress in the detail context.

## Impact

- Affected files: `src/App.tsx`, `src/ReviewWorkbenchPage.tsx`, `src/styles.css`, and possibly mock task data/types if needed.
- No production backend, real SSE endpoint, PDF renderer, or virtualization library is added in this MVP change.
- Future implementation can replace the mock timer stream with EventSource/WebSocket without changing the primary layout.
