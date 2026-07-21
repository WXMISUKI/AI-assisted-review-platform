## Context

The opening-condition pilot now produces task-owned human-review queues from real samples. The platform can already advance from human review to report generation, but the generated report package only exposes aggregate counts. For real pilot delivery and post-archive replay, that is too thin: the operator needs a bounded ledger of final human-review decisions.

## Goals / Non-Goals

**Goals:**
- Add a safe, bounded report-side ledger of human-review decisions.
- Keep the ledger derived from backend task state, not local fallback packet data.
- Render the ledger in the report archive page so archived tasks remain explainable.
- Guard the behavior with backend tests and frontend type safety.

**Non-Goals:**
- No downloadable formal PDF/Word report asset.
- No free-form long review narratives or unbounded document excerpts.
- No reviewer assignment workflow or SLA model.
- No OCR/provider behavior changes.

## Decisions

1. Derive the ledger from `humanReviewQueue`.
   - Decision: generate report package ledger items from task-owned `humanReviewQueue` at report generation time.
   - Rationale: this is the authoritative human-review fact set and already carries safe status, reason, note, reviewer, and evidence ids.

2. Store only bounded safe fields.
   - Decision: each ledger item includes `reviewId`, `targetType`, `targetId`, `status`, `reason`, `safeNote`, `reviewerId`, `decidedAt`, and bounded `evidenceIds`.
   - Rationale: this is enough to explain the review conclusion without leaking raw OCR text, prompts, or private URLs.

3. Keep the ledger immutable after archive.
   - Decision: archived report packages preserve the generated ledger and reject later report regeneration as before.
   - Rationale: archived delivery artifacts must remain replayable and stable.

## Risks / Trade-offs

- [Risk] The ledger can become noisy for large queues. -> Mitigation: bound item count and string lengths through existing normalization rules.
- [Risk] Operators may want richer commentary later. -> Mitigation: current ledger preserves `safeNote`; richer structured annotations can be a later slice after repeated pilot runs.
