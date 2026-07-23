## Context

The previous slice established a deterministic `Basis Preview` lifecycle: preview extraction, human confirmation, publication, and run binding. The remaining production gap is that real OCR/Provider outputs cannot yet flow into that lifecycle as structured candidate facts. Without this, a pilot operator still has to trust metadata-derived placeholder facts or manually supplied text.

The platform already has provider boundary principles: OCR/MaxKB/LLM outputs must be normalized into platform-owned records before they affect workflow state. This change applies that principle to opening-condition basis governance.

## Goals / Non-Goals

**Goals:**

- Accept bounded OCR/Provider structured extraction output for a workspace basis record.
- Normalize provider fields into the existing `ingestionPreview.facts` contract.
- Preserve provider provenance, confidence, missing fields, safe snippets, and next action.
- Force provider-derived previews back to `needs_confirmation`.
- Add backend, HTTP, frontend/domain, and smoke coverage for provider ingestion.

**Non-Goals:**

- Do not submit new OCR jobs or poll remote OCR status in this slice.
- Do not integrate live MaxKB retrieval or change provider credentials.
- Do not create asynchronous extraction jobs or a database migration.
- Do not redesign the full basis governance UI.
- Do not allow provider output to publish or approve a basis automatically.

## Decisions

1. **Reuse the existing `Basis Preview` contract.**
   - Rationale: confirmation, publication, run readiness, and UI already understand this aggregate.
   - Alternative rejected: create a separate provider extraction table or job model now. That is valuable later, but too broad for the next fastest production slice.

2. **Expose provider ingestion as a basis-record action.**
   - Rationale: operators review a basis asset, not a generic provider payload.
   - The route should sit beside `extract`, `decision`, and `publish`.

3. **Normalize provider output through a bounded adapter.**
   - Rationale: provider schemas vary. The platform should accept common shapes such as `facts`, `fields`, `entities`, `summary`, and `snippets`, then map only approved keys into preview facts.

4. **Always require human confirmation after provider ingestion.**
   - Rationale: provider output can be wrong, stale, or point to the wrong project/contract package. It must never become a formal basis without an operator decision.

## Risks / Trade-offs

- Provider schemas are inconsistent -> start with a tolerant adapter and smoke-test common payload shapes.
- Fact quality may be shallow -> record confidence and missing fields instead of pretending certainty.
- UI remains dense -> show provider provenance in existing preview detail blocks, then defer larger interaction redesign.
- This is still synchronous -> acceptable for bounded payloads; later OCR job orchestration can write through the same action.
