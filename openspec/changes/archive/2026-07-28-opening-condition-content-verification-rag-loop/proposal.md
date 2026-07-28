## Why

The opening-condition pilot can now create platform-owned tasks, extract checklist items, split packet manifests, route uncertainty to human review, and generate reports. The remaining gap is that formal matching is still mostly based on packet filenames and summaries, while the Dify reference workflow uses per-file OCR, file-level semantic matching, and basis-aware verification to judge whether submitted materials are substantively correct.

## What Changes

- Add a platform-owned content verification stage after packet assetization and before final human-review readiness.
- Persist bounded per-file content facts for packet-derived assets, including extractor status, safe summary, safe snippets, locators, and provider references.
- Add file-level semantic matching outputs that can upgrade a filename match into content-supported evidence, downgrade it to mismatch, or route it to human review.
- Add basis/RAG-assisted verification facts that compare submitted packet evidence against published contract/qualification basis, master data, and knowledge-base retrieval hits without making MaxKB or Dify the source of truth.
- Keep the browser isolated from Dify, OCR Worker, and MaxKB credentials; external systems remain provider adapters.
- Keep large-PDF deep page splitting/OCR annotation and live legal rectification generation out of this batch.

## Capabilities

### New Capabilities
- `opening-condition-content-verification`: Platform-owned content facts, semantic material matching, and basis-assisted verification for opening-condition material review.

### Modified Capabilities
- `opening-condition-platform-orchestrated-agent-run`: The automatic run records content verification before deciding whether items pass, fail, or require human review.
- `maxkb-material-packet-coordination`: Provider coordination includes bounded packet content ingestion and retrieval-check handoff semantics.

## Impact

- Backend opening-condition task store and normalizers.
- Pilot matching/report tests and UI boundary smoke tests where content diagnostics appear.
- OpenSpec requirements for platform workflow and provider coordination.
- No new runtime dependency is required in this batch; provider output is accepted through bounded platform input contracts.
