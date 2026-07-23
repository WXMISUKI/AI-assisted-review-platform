## Why

The pilot chain can now be verified end to end, but supervisors still cannot clearly see what the platform intends to store as formal contract/qualification basis before it is published. This creates confusion between "packet evidence is missing" and "basis/master-data facts need human confirmation", which blocks production trial confidence.

## What Changes

- Add a structured basis-ingestion preview for uploaded contract/qualification basis records.
- Require the preview to show source file, extracted/derived facts, confidence, missing fields, and human confirmation status before publication.
- Keep formal checklist matching gated by published basis and approved/published master data, but make the reason visible from both intake preview and publication governance.
- Add retained smoke coverage for the preview -> confirm -> publish -> task binding flow.
- Document the next production direction after this slice: richer OCR/provider extraction and frontend workbench refactor.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opening-condition-basis-workflow`: basis records gain an operator-facing structured ingestion preview before publication.
- `opening-condition-publication-governance`: governance pages distinguish preview-ready, confirmation-needed, publish-ready, published, and exception basis records.
- `opening-condition-intake-preview-and-publish-gate`: the intake gate explains the current run's basis preview status and blocks formal matching until preview-confirmed basis is published.

## Impact

- Affected backend: `server/openingConditionPilotStore.mjs`, opening-condition HTTP routes, retained smoke tests.
- Affected frontend: `src/domain/backendConnectivity.ts`, `src/domain/openingConditionPilot.ts`, `src/productWorkspacePages.tsx`.
- Affected docs: opening-condition runbook and production roadmap.
- No new external provider, database migration, or docx/pdf export.
