## Why

The human-review detail page now shows content-verification facts, but operators still need to manually find the referenced file in the preview pane. Linking each content fact to the available material preview makes the review decision faster and less error-prone.

## What Changes

- Add a review-mode preview override so selecting a content-fact row updates the left-side preview without leaving the human-review decision pane.
- Resolve previewable material files from content-fact identities, packet inventory entries, and evidence object references.
- Show a clear action only when a standalone preview asset exists; otherwise keep the existing safe diagnostic/empty-state behavior.
- Keep this batch UI-only and task-owned; do not add OCR, provider calls, page-level annotation, or backend persistence.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `opening-condition-human-review-check-item-context`: Content-fact rows in review detail can link to the corresponding previewable evidence file when available.
- `opening-condition-pilot-execution-console`: Focused review mode can switch the left preview based on a selected content fact without exiting review mode.

## Impact

- Frontend review-detail view model and focused review interaction in `src/productWorkspacePages.tsx`.
- Opening-condition scoped styles in `src/styles/opening-condition.css`.
- UI boundary smoke assertions for preview-linking controls.
