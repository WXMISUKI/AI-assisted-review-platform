## Why

Operators can now receive task-owned content verification results, but the human-review detail page still hides the concrete packet content facts behind generic reason text. This makes it hard to decide whether to accept, correct, or reject an AI-flagged checklist item.

## What Changes

- Show content-verification diagnostics in the opening-condition human-review detail view.
- Link checklist evidence to the matching packet content facts by packet entry, object id, or filename.
- Render safe summaries, snippets, locators, extractor/provider metadata, confidence, and status labels without exposing raw OCR text or private URLs.
- Keep this batch UI/read-model only; do not add OCR execution, new provider routes, or legal-generation logic.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `opening-condition-content-verification`: Content facts must be renderable as bounded operator-facing diagnostics for the relevant checklist item.
- `opening-condition-human-review-check-item-context`: Human-review detail context must include content fact status, summary/snippets, locators, and evidence linkage when available.
- `opening-condition-pilot-execution-console`: The task detail console must show a content-verification evidence block in the人工复核详情 view.

## Impact

- Frontend opening-condition task detail rendering in `src/productWorkspacePages.tsx`.
- Opening-condition styles in `src/styles/opening-condition.css`.
- UI boundary smoke coverage for content fact visibility.
- No backend API or persistence migration is required.
