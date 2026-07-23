## Context

The opening-condition pilot already stores basis records, master-data records, knowledge-base refs, run-bound snapshots, and report history in the local file adapter. Existing trial bootstrap creates placeholder/published basis and master-data facts so the chain can run, but the operator experience still does not explain what structured basis facts are being accepted before publication.

Mature construction document platforms make reviewable records explicit before approval: source, version, status, responsible reviewer, and the next action are visible. This change applies that pattern to basis ingestion without introducing a full OCR pipeline or database migration.

## Goals / Non-Goals

**Goals:**

- Add a safe structured preview model to basis records.
- Let HTTP/API callers create or update a basis record with preview facts and then confirm/publish it.
- Surface preview status, missing fields, and current-run binding on the basis/master-data governance page.
- Add smoke coverage that proves provisional preview records do not become formal matching basis until human confirmed/published.

**Non-Goals:**

- Do not implement real OCR extraction of contract clauses in this slice.
- Do not migrate local file storage to a database.
- Do not redesign the whole basis page or global UI style.
- Do not generate final Word/PDF reports.

## Decisions

1. **Store preview facts inside the existing basis record.**
   - Rationale: this keeps the current local adapter and API shape small while making the production concept testable.
   - Alternative rejected: create a separate ingestion-job aggregate now. That is better long term, but premature before real provider ingestion is wired.

2. **Use deterministic placeholder derivation for trial bootstrap.**
   - Rationale: the current system can generate safe facts from source object metadata, then require human confirmation.
   - Alternative rejected: block the feature until OCR/provider extraction exists. That would delay the highest-value governance loop.

3. **Confirm then publish, not publish directly from raw upload.**
   - Rationale: it aligns with the platform rule that AI/provider output is advisory and human confirmation owns formal basis.
   - Alternative rejected: auto-publish any uploaded basis. That would recreate the current confusion at higher confidence.

4. **Keep UI changes semantic and local.**
   - Rationale: report/workspace visual refactor remains later work; this slice should make the chain clearer without changing the whole design system.

## Risks / Trade-offs

- Preview facts are still derived from metadata or manually provided inputs, not OCR content -> label them as provisional and require human confirmation.
- Adding fields to basis records can be misread as production schema finalization -> keep names bounded and document that database schema can evolve later.
- UI density may remain imperfect -> this change improves meaning, not full aesthetics.
