## Context

The platform already has a working OCR gate, a document library, and a review workbench, but the phase between "OCR done" and "review ready" is still under-modeled. Today that phase is visually represented by a single loading page and a coarse stream stage index. The next step is to make the pipeline legible: users should be able to see which stage is active, which paragraph or section is being processed, and which agent boundary is responsible for each step.

This matters for two reasons. First, construction plan review is not one monolithic AI action; the system needs a normalization step to recover usable structure from OCR output before review reasoning begins. Second, the platform is evolving toward a configurable agent asset model, so the UI and session state need to reflect agents as explicit assets instead of hidden implementation detail.

## Goals / Non-Goals

**Goals:**
- Model post-OCR processing as a staged pipeline with visible progress.
- Expose current paragraph / section context during streaming review preparation.
- Keep detail-page access during processing while locking editing actions until ready.
- Reserve explicit agent assets for structure restoration, review analysis, and report generation.
- Preserve mock compatibility so the frontend can demonstrate the workflow before backend orchestration lands.

**Non-Goals:**
- Do not implement real OCR parsing, PDF layout recovery, or LLM prompt execution in this change.
- Do not build a full CRUD system for prompt assets yet.
- Do not change the actual review judgment logic or result asset format beyond what is needed for orchestration visibility.
- Do not add WebSocket bi-directional collaboration; SSE-style one-way progress is enough for this phase.

## Decisions

1. **Use a linear pipeline snapshot instead of separate booleans.**  
   The current `reviewing` state is too coarse. A compact pipeline snapshot can carry stage id, stage title, active agent, and paragraph progress without forcing the UI to infer state from multiple flags.  
   Alternatives considered: multiple state flags, or a separate workflow entity. Both add complexity for little gain at MVP scale.

2. **Keep SSE as the progress transport contract.**  
   The repo already has a review streaming endpoint and browser EventSource support. SSE is enough for one-way review progress and aligns well with the detail-page "live but locked" experience.  
   Alternatives considered: polling only, or WebSockets. Polling is less expressive for stage updates; WebSockets are more than we need right now.

3. **Separate OCR from review orchestration, but connect them through a handoff boundary.**  
   OCR remains a gate. Once OCR completes, a normalization/structure-restoration stage can prepare the document for review, then the review kernel can produce issues, and finally a report agent can package results.  
   Alternatives considered: merge OCR and review into one pipeline, or jump straight from OCR to issue generation. Both would hide the normalization work the user asked to see.

4. **Treat agent assets as registry entries, not as a full runtime scheduler.**  
   The data-assets page should make agent roles visible and bind prompts to them, but the runtime orchestration can still be mocked and later replaced by backend services.  
   Alternatives considered: full runtime DAG management, or hard-coded single-agent flows. The former is too large; the latter is too rigid.

5. **Keep the UI locked, not inert, during processing.**  
   Users should be able to enter the detail page and observe progress, but not edit annotations until the pipeline is ready. This matches the enterprise review workflow the product is aiming for.

## Risks / Trade-offs

- [Risk] The stage model may drift from the eventual backend pipeline. → Mitigation: keep stage ids generic and use a fallback label for unknown stages.
- [Risk] Paragraph-level progress may be approximate for some source documents. → Mitigation: allow section labels and paragraph indexes to degrade gracefully when the backend cannot provide exact anchors.
- [Risk] Adding more agent types can make the data-assets page feel heavy. → Mitigation: keep the initial inventory small and role-focused, with placeholder binding for future expansion.
- [Risk] The mock flow may look "complete" without real backend orchestration. → Mitigation: clearly label the current workbench as mock-backed and keep the event contract backend-replaceable.
