## Context

We already chose the fastest MVP route for “original-page-like” review: a near-source HTML preview of uploaded DOCX files rather than Word-native editing or page-coordinate annotation. The repository already has:

- persisted `sourceObject` metadata on review tasks
- a backend `POST /api/minio/presign` endpoint
- a paragraph-based workbench with active issue, paragraph, and section focus state

That makes this slice a good vertical step: the preview can remain read-only, reuse existing issue focus state, and avoid any new backend conversion pipeline.

## Goals / Non-Goals

**Goals:**

- Render uploaded `.docx` files inside the workbench with higher source fidelity than the flattened paragraph list.
- Keep issue review actions unchanged while adding issue-to-preview focus.
- Use safe temporary highlight and scroll behavior so reviewers can inspect roughly where a finding came from in the original document.
- Preserve fallback behavior when no stored source object exists or the file is not `.docx`.

**Non-Goals:**

- Do not implement PDF conversion, true page coordinates, or page overlay annotations.
- Do not introduce OnlyOffice, Office.js, or commercial layout engines in this slice.
- Do not replace the existing paragraph workbench or processed-preview surfaces.
- Do not build viewer-side text selection annotations in this slice.

## Decisions

1. Use `docx-preview` as a read-only near-source preview.
   - Rationale: fastest path in the current React/Vite stack, already aligned with the MVP route chosen earlier.
   - Alternative considered: server-side DOCX to PDF/HTML conversion. Rejected for this slice because it adds new runtime surfaces and slows delivery.

2. Reuse task `sourceObject` plus `/api/minio/presign` rather than inventing a new document fetch contract.
   - Rationale: the backend object-storage boundary already exists and keeps private URLs out of persisted task data.
   - Alternative considered: persist direct file URLs on the task. Rejected because it weakens the storage boundary.

3. Use approximate DOM-node focus instead of exact run-range mapping.
   - Rationale: this MVP only needs “reviewer can inspect likely original location” rather than exact range comments.
   - Alternative considered: build run-level anchor mapping now. Rejected because it would expand scope into a new anchoring subsystem.

4. Keep the existing text workbench as the review-action source of truth.
   - Rationale: decision controls, manual issues, and processed preview already work there; the preview should increase trust and navigation value without destabilizing the workflow.

## Risks / Trade-offs

- [Risk] `docx-preview` may not perfectly preserve some TOC, tab-stop, or pagination edge cases.
  - Mitigation: this is acceptable because the viewer is framed as near-source preview, not page-truth rendering.
- [Risk] Approximate text matching may highlight a nearby duplicate line instead of the exact originating run.
  - Mitigation: prefer anchor text first, then paragraph text fallback, and visually scope highlight to one block at a time.
- [Risk] Preview fetch or rendering can fail for some tasks.
  - Mitigation: preserve a clear fallback state and keep the existing paragraph workbench fully usable.
