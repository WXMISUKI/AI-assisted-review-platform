## Context

Focused human-review mode renders the file preview on the left and decision controls on the right. Content-fact diagnostics are already rendered in the decision pane, but they are static. The existing preview resolver chooses the first evidence-backed file, so multi-evidence items and content-fact diagnostics cannot direct the user to the exact file being discussed.

## Goals / Non-Goals

**Goals:**

- Attach a previewable material file id to each content-fact diagnostic when possible.
- Let an operator click a content-fact diagnostic action to update the left preview while staying in review mode.
- Reset the preview override when the operator opens another review item or leaves focused review mode.
- Preserve safe empty states for manifest-only or unsupported content facts.

**Non-Goals:**

- Do not implement PDF page jump, OCR highlights, or locator annotation.
- Do not introduce a new backend endpoint.
- Do not change review-decision semantics.

## Decisions

1. **Use review-mode local state for preview override.**

   A small `reviewPreviewOverrideFileId` state is sufficient. It avoids changing the broader workbench mode and keeps decision controls visible.

2. **Resolve preview files in the existing frontend view model.**

   The resolver already has task packet inventory, evidence records, material files, and content facts. It will prefer exact storage/object identity, then packet-derived ids, then normalized filenames.

3. **Render link actions conservatively.**

   If no previewable file can be linked, the row remains readable but disabled from preview switching. This avoids pretending manifest-only ZIP entries are previewable.

## Risks / Trade-offs

- Filename fallback can collide for duplicate names -> prefer object/storage ids first and keep file-row label visible.
- Locator text still cannot jump to a PDF page -> display locator text and switch only to the file-level preview for now.
