## Context

The platform already submits stored documents to OCR and can show OCR progress in the library and detail view. What it cannot yet do is turn OCR output into a stable, review-ready document representation. Real OCR results often come as page-oriented text, markdown blocks, images, and layout fragments; that output is useful, but the review workbench needs a document model with paragraphs, sections, anchors, and ordering metadata.

This change introduces that missing layer. It does not replace OCR itself. Instead, it defines the recovery step that converts OCR output into a normalized structure that can be persisted, streamed, reopened, and consumed by the review agent pipeline.

## Goals / Non-Goals

**Goals:**
- Define a normalized document structure that sits between OCR and review.
- Capture paragraph, section, page, and anchor metadata for later annotation.
- Preserve structure-recovery progress in the task/session state.
- Make the structure-restoration agent a visible part of the orchestration story.
- Keep the current mock workflow working while laying the seam for real OCR payload ingestion.

**Non-Goals:**
- Do not implement a full PDF layout engine.
- Do not build OCR parsing from scratch; this change consumes OCR output that already exists.
- Do not wire real PaddleOCR JSONL ingestion end-to-end yet if the backend boundary is not ready.
- Do not redesign the review workbench interaction model.

## Decisions

1. **Introduce a dedicated structure-recovery stage between OCR and review.**  
   This makes the pipeline honest: OCR extracts, structure recovery normalizes, review agent judges.  
   Alternatives considered: merge structure recovery into the review agent or hide it as a UI-only step. Both would make the pipeline harder to reason about.

2. **Normalize into a review-friendly document model instead of keeping raw OCR output as the source of truth.**  
   A paragraph/section model is easier to reopen, diff, anchor, and stream to the workbench.  
   Alternatives considered: store OCR JSONL directly, or keep a lossy plain-text string. Both reduce review fidelity.

3. **Treat recovery snapshots as persisted task state.**  
   Users can return to an in-progress task, and the platform should recover exactly where the structure parser left off.  
   Alternatives considered: recompute on every open, or only keep transient progress. Both would hurt UX and make streaming fragile.

4. **Keep the structure-restoration agent explicit.**  
   Even if the first implementation is mock-driven, the agent should appear in the data model and orchestration story so future backend calls do not require a redesign.  
   Alternatives considered: fold structure recovery into the review agent or OCR service. That would blur responsibility and complicate prompt ownership.

## Risks / Trade-offs

- [Risk] OCR payload formats may vary across files or providers. → Mitigation: define a tolerant normalized model and allow optional fields for page/layout metadata.
- [Risk] Recovered structure may be approximate for difficult scans. → Mitigation: keep recovery outputs partially typed and allow fallback to coarse section boundaries.
- [Risk] Adding another stage can make the pipeline feel heavier. → Mitigation: show recovery as a concise stage and reuse the existing loading/detail shell.
- [Risk] The mock implementation may overpromise exact layout fidelity. → Mitigation: label the current behavior as structure recovery, not full document rendering fidelity.
