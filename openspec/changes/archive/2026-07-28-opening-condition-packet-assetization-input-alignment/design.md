## Context

The opening-condition pilot already has platform-owned task state, packet `inventoryEntries`, and optional `derivedObjectRef` fields. The intended workflow is clear: contract/qualification basis is review context, checklist provides dynamic review items, and the material packet supplies evidence candidates. In current tests, ZIP-derived entries can still degrade to manifest-only or source-archive fallback, causing document preview and human-review evidence panes to open the original ZIP instead of the file being reviewed.

## Goals / Non-Goals

**Goals:**
- Make readable, supported ZIP entries attach a stable platform-owned derived object reference during intake.
- Ensure matching and preview choose derived packet assets ahead of source archives.
- Keep basis objects out of material evidence candidates and checklist review rows.
- Preserve safe fallback diagnostics for unsupported entries or unavailable object-storage reads.
- Add focused tests that prove the input chain stays aligned.

**Non-Goals:**
- No OCR, page-level PDF splitting, or visual annotation.
- No legal-basis lookup or LLM-generated rectification text.
- No replacement of the current Node BFF/store architecture.
- No broad UI redesign beyond using the existing preview target contract.

## Decisions

- **Use `inventoryEntries` as the single packet manifest contract.** Derived assets attach to entries rather than introducing a second parallel file list, keeping frontend preview, matching, report diagnostics, and archive reuse aligned.
- **Prefer derived assets at the evidence boundary.** When an inventory entry has `derivedObjectRef`, evidence records and preview rows should point to that object; source archives are fallback only.
- **Treat basis as context only.** Basis source objects remain available for readiness and matching context but do not become packet inventory entries or checklist-derived review items.
- **Keep extraction bounded.** Only supported file extensions/content types and size-limited entries are assetized; unsupported entries remain manifest-only with fallback reason.

## Risks / Trade-offs

- **Some ZIP entries still cannot preview** -> Keep explicit `manifest_only` status and fallback reason so the operator knows whether this is old data, unsupported type, or extraction failure.
- **Derived upload can fail independently of manifest extraction** -> Keep the manifest entry and record `zip_entry_upload_failed` instead of dropping the file from the list.
- **Matching remains filename/material-name based in this batch** -> This is acceptable for MVP completeness matching and leaves OCR/content matching for a later batch.
