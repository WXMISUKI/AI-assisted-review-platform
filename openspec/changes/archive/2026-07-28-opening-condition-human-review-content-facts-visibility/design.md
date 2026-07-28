## Context

The backend stores `packet.contentFacts` and `checkItems[].semanticMatch`, and formal matching writes human-review reasons. The frontend already has a focused review mode with document preview on the left and decision controls on the right. The missing piece is a compact, safe diagnostic block that explains what content facts exist for the selected checklist item.

## Goals / Non-Goals

**Goals:**

- Resolve content facts for the active check item from its evidence records and packet inventory identities.
- Display semantic verdict, document presence, relevance, content compliance, content-fact status, bounded summary/snippets, locators, provider/extractor, and confidence.
- Keep empty states honest when content facts are absent or unsupported.
- Preserve the current review decision workflow and layout.

**Non-Goals:**

- Do not parse OCR text in the browser.
- Do not call MaxKB, OCR Worker, or object storage directly from this UI.
- Do not add new report generation behavior.
- Do not redesign the whole task detail page.

## Decisions

1. **Derive a view model locally from task-owned facts.**

   The UI will build a small content-fact view model from `selectedAgentTask.checkItems`, `evidence`, `packet.inventoryEntries`, and `packet.contentFacts`. This avoids a new endpoint and keeps the frontend as a renderer of backend facts.

2. **Prefer evidence-linked facts over broad packet facts.**

   The resolver will match by evidence object id/storage file name, packet entry id, derived object id, source object id, relative path, and normalized file name. This keeps the displayed facts tied to the active checklist item instead of dumping the whole packet.

3. **Show bounded diagnostics as compact rows.**

   Each fact row will show status/confidence, file/locator, summary/snippet, and provider/extractor metadata. Long lists will be capped to keep the review pane usable.

## Risks / Trade-offs

- Matching content facts by filename can be imperfect -> prefer ids first and label filename matches as diagnostics, not final proof.
- Some old tasks lack content facts -> show a clear empty state instead of hiding the section.
- Additional UI density could crowd decision controls -> keep the block compact and below the primary reason summary.
