## Context

The repository already has two parallel document experiences inside the construction-plan review workbench:

- a paragraph-based review model driven by recovered `paragraphId + offsets`
- a source-faithful `.docx` viewer driven by `docx-preview`

The current preview MVP is useful for source inspection, but it does not yet own the main review interaction. The issue list, manual annotation flow, and current focus model are still centered on the paragraph surface. This mismatch is now the main product bottleneck.

## Goals / Non-Goals

**Goals**

- Make the viewer the main detail-page reading surface for ready `.docx` review tasks.
- Reduce user-visible interference from cover/toc paragraph artifacts in the detail page.
- Keep issue review decisions unchanged while improving issue-to-viewer landing and highlight behavior.
- Allow reviewers to select text directly inside the viewer and create a manual issue from that selection.
- Preserve compatibility with existing tasks and paragraph-based anchors.

**Non-Goals**

- Do not introduce OnlyOffice, Office.js, or Word-native comment editing.
- Do not build a true page-coordinate annotation engine in this slice.
- Do not replace backend review generation, issue decision storage, or completion flow.
- Do not attempt perfect DOCX run-level fidelity or duplicate full Word review semantics.

## Decisions

1. Keep `docx-preview` as the viewer base.
   - Rationale: fastest path with the current Vite/React stack and already shipped preview foundation.
   - Rejected alternative: switch to Word-native/editor embedding now. Too heavy for the MVP loop.

2. Make the viewer the primary detail reading surface, but keep paragraph data as a compatibility layer.
   - Rationale: existing issue anchors, processed preview, and fallback flows still depend on paragraphs.
   - Rejected alternative: delete the paragraph model immediately. Too risky for currently persisted tasks.

3. Add an optional viewer anchor instead of replacing the paragraph anchor contract.
   - Rationale: old tasks and old issue-generation output still rely on `paragraphId/startOffset/endOffset/text`.
   - Rejected alternative: migrate all issue anchors to a new format now. Too much scope and migration risk.

4. Use DOM block matching and DOM text selection for MVP viewer interaction.
   - Rationale: enough to support stable visible focus and manual issue creation without building a coordinate system.
   - Rejected alternative: implement overlay rectangles or canvas annotation first. Useful later, not the fastest first step.

## Viewer-first MVP Model

### Task Group A: Viewer-first workbench

- The page-like DOCX viewer becomes the primary document panel content.
- The old paragraph-rendered review surface is reduced to a fallback/debug section and is not the main operator surface.
- Issue grouping and decision controls remain in the right rail.
- Cover/toc-derived paragraph content is de-emphasized or filtered from the primary detail experience where feasible.

### Task Group B: Issue-to-viewer binding

- The viewer keeps a lightweight registry of rendered text blocks after `docx-preview` completes.
- Active issue focus uses preferred search terms in this order:
  1. viewer anchor match text
  2. paragraph anchor text
  3. fallback paragraph text
  4. finding title
- Matching prefers the closest normalized text block instead of the first arbitrary node in the DOM.
- Active focus applies a stronger visible highlight state and scrolls the matched block into view.

### Task Group C: Viewer-side manual annotation

- The viewer listens for text selection inside the rendered original-page DOM.
- A valid selection creates a draft with:
  - selected text
  - best-effort matched page/block context
  - fallback paragraph anchor if available
- Submitting the form creates a normal manual `ReviewIssue` plus an optional viewer anchor snapshot.
- Existing decision, delete, and completion flows remain unchanged.

## Data Contract Decision

Add an optional `viewer` anchor branch under the review anchor contract:

- `matchText`: normalized text used to relocate in the viewer
- `blockText`: matched block text snapshot when the issue was created
- `pageHint`: optional 1-based page hint when the viewer can infer it
- `blockHint`: optional stable block hint inside the page-like DOM

This anchor is advisory, not authoritative. Paragraph anchor data remains the compatibility anchor for old tasks, processed preview, and existing logic.

## Risks / Trade-offs

- `docx-preview` block structure can change between documents, so viewer anchoring remains best-effort.
  - Mitigation: keep paragraph anchor fallback and do not promise exact Word comment semantics.

- Viewer selection cannot map perfectly back to recovered paragraphs for every document.
  - Mitigation: manual issues can store viewer anchor data even when paragraph fallback is coarse.

- Hiding too much of the old paragraph surface could remove a debugging safety net.
  - Mitigation: keep it as a secondary fallback/debug area rather than deleting it.

## Acceptance Shape

This change is successful when:

- reviewers primarily inspect the uploaded DOCX through the viewer rather than paragraph cards
- clicking an issue reliably lands in a visibly highlighted region of the viewer often enough for MVP review work
- reviewers can select text in the viewer and create a manual issue without switching back to the old paragraph surface
- existing tasks without viewer anchors still remain reviewable
