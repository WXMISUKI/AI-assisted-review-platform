## Context

The platform deliberately owns task state, checklist facts, packet inventory, evidence, human decisions, and report assets. Dify remains a schema and prompt reference. Current matching uses packet inventory candidates and deterministic text scoring over file names and summaries, which is useful for material completeness but not enough for content correctness.

The Dify reference workflow has three ideas worth bringing into the platform:

- per-file extraction/OCR before review;
- file-level semantic matching based on substantive content, not filename mentions;
- deeper material review that compares submitted facts with basis, master data, and retrieval/search context.

## Goals / Non-Goals

**Goals:**

- Persist safe packet content facts on the platform task.
- Let matching prefer content-supported semantic hits when available.
- Record basis/RAG-assisted verification diagnostics as supporting facts, not authoritative external conclusions.
- Route mismatch, provider conflict, insufficient content, and low confidence into human review.
- Preserve the current platform-owned run state and report generation model.

**Non-Goals:**

- Do not call Dify directly from the browser or make Dify the runtime state store.
- Do not implement large PDF deep page splitting, OCR page annotations, or pinpoint visual markup in this batch.
- Do not implement live LLM legal-basis and rectification generation in this batch.
- Do not treat contract/qualification basis files as checklist items or submitted material evidence candidates.

## Decisions

1. **Content facts are stored as bounded platform records.**

   External OCR or provider outputs are normalized into `packetContentFacts` with safe summaries, snippets, locators, confidence, status, and provider refs. Raw OCR text, private URLs, credentials, and unbounded traces are not persisted.

2. **Semantic matching is an overlay on deterministic matching.**

   The existing packet inventory match remains the fallback. When content facts are available, they can produce `semanticMatch` diagnostics and affect `relevanceStatus` / `contentCompliance`. This avoids breaking old tasks that only have manifests or derived previews.

3. **Basis/RAG verification is supporting context, not the source of truth.**

   Retrieval hits and provider refs may support or challenge a match, but platform facts and human decisions remain authoritative. Conflicts become human-review reasons.

4. **Human review remains the only pause point.**

   Automatic stages may record extraction, content verification, semantic matching, and retrieval diagnostics. The workflow only waits when formal review requires operator judgement.

## Risks / Trade-offs

- Provider output may be partial or unavailable -> keep deterministic matching fallback and record `insufficient_content`.
- Content snippets may leak sensitive raw text -> normalize and bound snippets before storage.
- RAG hits can conflict with project basis or human decisions -> treat them as supporting recall and route conflicts to human review.
- Adding content fields may affect existing task snapshots -> make all new fields optional and normalized with safe defaults.
