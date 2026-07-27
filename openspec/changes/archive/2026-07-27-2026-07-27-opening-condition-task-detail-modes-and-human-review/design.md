## Design Summary

This change keeps the opening-condition platform on the same backend-owned orchestration path and only reshapes the operator workbench.

### Selected-task state

The task detail gets an explicit local mode:

- `list`: collapsed `资料文档库` and `待核查资料项`, plus progress/report context.
- `preview`: full work area shows one selected file preview with loading state and return action.
- `review`: full work area shows one selected checklist/review item with left-side file preview and right-side review controls.

The default stays `list`. Clicking a document row enters `preview`. Clicking a checklist item enters `review`.

### Human review detail

The review detail does not invent conclusions. It reads task-owned `checkItems`, `evidence`, and `humanReviewQueue`, then lets the operator submit one of the existing backend decisions with an optional safe note. Once submitted, the page refreshes through the existing app wiring and keeps the operator in the task workbench.

When all blocking review items are closed, the list view exposes the existing completion action so the workflow can continue into final report generation.

### Preview behavior

The generic preview shell is no longer rendered by default in list mode. Preview appears only after an explicit click, with a loading message while the presigned URL and DOCX renderer resolve.

### Layout rules

- Sidebar nav/history rows use `width: 100%`, `min-width: 0`, and box-sizing-safe spacing.
- Task detail columns use `minmax(0, ...)`, flexible heights, and hidden overflow at the section boundary only.
- Preview/review sublayouts use their own bounded scroll regions instead of forcing the main detail pane to overflow horizontally.
