## Context

Current DOCX review quality is dominated by a structure problem, not a prompt problem. The parser extracts `<w:p>` text with minimal style handling, the rule engine scans every paragraph equally, and the LLM chapter generator inherits the same flattened input. This makes directory lines, page-number leaders, and front-matter fragments look like ordinary review text.

The most valuable MVP move is to create a stable structure gate before adding a source-faithful viewer. Without that gate, a viewer would only render wrong review targets more beautifully.

## Goals / Non-Goals

**Goals:**

- Distinguish cover / TOC / body content during DOCX extraction.
- Preserve that distinction on recovered paragraphs with explicit metadata.
- Ensure rule review and chapter-level LLM review only consume `reviewEligible !== false` paragraphs.
- Keep the implementation lightweight and compatible with the current JS stack.

**Non-Goals:**

- Do not introduce `docx-preview`, PDF viewers, or OnlyOffice in this slice.
- Do not attempt true page mapping or run-level annotation yet.
- Do not redesign the frontend review workbench.
- Do not rewrite all DOCX extraction heuristics; only add enough structure gating to stop the current false-positive class.

## Decisions

1. Preserve non-body paragraphs in recovered structure, but exclude them from review sections.
   - Rationale: this keeps future source-faithful preview options open while immediately gating audit logic.
   - Alternative considered: drop cover/TOC paragraphs entirely. Rejected because later viewer work would need to recover them again.

2. Use lightweight DOCX heuristics instead of full OOXML semantic modeling.
   - Rationale: the current MVP needs a fast win. Style ids like `TOCHeading` / `TOC*`, early-document cover state, and TOC-like line patterns are enough to remove the current false-positive class.
   - Alternative considered: fully parse fields, bookmarks, and tab stops now. Rejected as too heavy for this slice.

3. Keep headings out of review paragraphs, but let them define body sections.
   - Rationale: the current frontend and downstream issue model already assume sections are navigation containers rather than editable body paragraphs.
   - Alternative considered: add heading paragraphs to the review stream immediately. Rejected because it would create unnecessary UI churn before the viewer slice.

## Risks / Trade-offs

- [Risk] Some real prefatory text before the first numbered heading may be classified as cover and skipped from review.
  - Mitigation: acceptable for MVP; this is lower risk than reviewing obvious cover and TOC noise as body content.
- [Risk] TOC heuristics may miss some unusual directory formatting.
  - Mitigation: combine style-based detection with in-TOC mode and trailing-page-number heuristics; future parser slices can refine this further.
