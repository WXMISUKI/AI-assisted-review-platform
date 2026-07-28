## Why

Recent tests show the opening-condition agent can list ZIP packet entries, but some entries still preview as the original archive or cannot become stable evidence for checklist review. This blocks the agreed platform-owned workflow because checklist matching, human review, and report generation need real packet file assets instead of coarse ZIP-level placeholders.

## What Changes

- Make ZIP packet derived file assets a required input boundary for previewable material entries when object storage can read the archive.
- Keep manifest-only entries as bounded fallback, but clearly preserve why a derived preview asset was not created.
- Ensure material matching prefers derived packet file assets and never treats the contract/qualification basis object as a checklist item or packet evidence candidate.
- Add smoke/regression coverage for derived asset references, preview target selection, and basis-as-context behavior.
- Keep large PDF page splitting/OCR annotation and legal rectification generation out of this batch.

## Capabilities

### New Capabilities

### Modified Capabilities
- `opening-condition-packet-item-assets`: require supported ZIP entries to attach stable derived object refs when the archive is readable.
- `opening-condition-platform-orchestrated-agent-run`: ensure automatic run inputs use derived packet assets for material matching and keep basis context out of packet evidence.
- `opening-condition-pilot-execution-console`: ensure document-library preview opens derived packet assets before falling back to source archives.

## Impact

- `server/openingConditionPilotStore.mjs` for inventory resolution, derived asset attachment, and matching candidate selection.
- `server/openingConditionZipManifest.mjs` for bounded previewable ZIP entry support if needed.
- `src/productWorkspacePages.tsx` for preview-source prioritization if the current UI still falls back to source archives incorrectly.
- Existing opening-condition smoke tests for store and UI boundary coverage.
