## Design

### Checklist Extraction

The platform will resolve checklist definitions in this order:

1. Request-level `checklistItems`, when explicitly provided.
2. Uploaded checklist document extraction, when the checklist object has a storage key and the backend can read the object buffer.
3. Known template fallback, currently 承台施工条件核查表.
4. Manual definition required diagnostic.

The document extractor will parse DOCX table rows using the existing `docxParser` logic. It will treat table-row text as structured enough for MVP extraction:

- Rows containing `现场核查` are ignored.
- Rows not containing `资料核查` are ignored unless they clearly contain material/checklist terms and no现场 signal.
- Content comes from the longest useful row cell.
- Materials are derived from common delimiters and document-name keywords.
- `★` marks mandatory.
- `按需` marks as-needed.

This is intentionally deterministic and auditable. It is not a general LLM parser yet.

### History Delete

Deletion is a mutable history-management action, separate from archive. It removes the selected task from local store/history. The UI will show a small delete control on history rows and stop event propagation so clicking delete does not open the detail page.

### File Preview

The opening-condition detail pane will reuse the same browser-side pattern already proven in `SourceFaithfulDocxPreview`:

- Ask backend for a presigned MinIO URL by `storageKey`.
- Fetch the blob in the browser.
- For DOCX, call `docx-preview.renderAsync(blob, container, undefined, options)`.
- For non-DOCX files, show a safe link/open fallback instead of pretending to preview.

### Agent Progress

The progress pane will be event-led:

- Render task events as an ordered timeline.
- Show completed/active/waiting states.
- When the task is `awaiting_human_review`, the active step is the human-review pause and the UI points to the review action.
- Other steps are automatic platform workflow steps.

## Risks

- DOCX table extraction is heuristic. It must fail safely and surface diagnostics instead of inventing items.
- Delete is destructive for local history. Keep it explicit and scoped to the selected/opening-condition task list.
- Presigned preview depends on MinIO availability; fallback must remain usable.
