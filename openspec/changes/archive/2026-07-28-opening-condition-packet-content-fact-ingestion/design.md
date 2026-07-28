## Context

The platform now stores `packet.contentFacts` and uses them during semantic matching. However, current intake only preserves `contentFacts` when callers explicitly provide them. This leaves a gap between ZIP assetization and content verification: the task cannot tell which files are waiting for OCR/provider extraction versus which files are unsupported or metadata-only.

## Goals / Non-Goals

**Goals:**

- Initialize one bounded content fact per packet inventory entry when possible.
- Preserve caller/provider-supplied facts and fill gaps for entries without facts.
- Provide a task-scoped backend ingestion operation for provider batch output.
- Keep merge semantics idempotent by packet entry id, derived object id, source object id, or normalized file name.
- Record workflow events and safe diagnostics when content facts are initialized or updated.

**Non-Goals:**

- Do not implement OCR parsing inside the platform in this batch.
- Do not store raw full text or private provider traces.
- Do not call MaxKB/OCR Worker directly from the browser.
- Do not implement page-level PDF splitting, OCR annotations, or legal rectification generation.

## Decisions

1. **Initialize metadata facts during packet normalization/intake.**

   The platform creates safe content-fact placeholders from inventory entries and derived object refs. This gives matching and UI a stable signal that content verification is pending or unsupported rather than absent by accident.

2. **Provider ingestion updates the same fact records.**

   The store exposes a merge operation that normalizes provider outputs into existing packet content facts. It prefers stable ids in this order: packet entry id, derived object id, source object id, normalized file name.

3. **Generated facts are conservative.**

   Metadata-only facts use `pending` unless a safe summary already exists. Unsupported or manifest-only entries remain `unsupported` or `partial`, which keeps substantive judgement eligible for human review.

## Risks / Trade-offs

- Metadata placeholders could be mistaken for real OCR facts -> use explicit extractor/status values and keep semantic matching conservative.
- Provider duplicates can create noisy facts -> merge by stable packet/file identity before appending.
- Existing snapshots lack content facts -> normalizers keep the field optional and derive only on new intake/provider update.
