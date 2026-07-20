## Why

The MaxKB Provider Proxy has been validated, and the opening-condition pilot already has backend task state, basis, master data, knowledge-base binding, packet intake, ZIP manifest extraction, matching, human review, report, and archive primitives.

The highest-value next step is not more local optimization. It is to let an operator run a real single-project trial with actual files: contract/basis attachment, checklist document, and a zipped material packet. This will expose the real gaps in file intake, OCR/knowledge handoff, matching quality, human review, and reporting.

## What Changes

- Add a domain-level trial bootstrap API that accepts uploaded object references and creates the platform-owned pilot facts in one call.
- Keep file bytes flowing through the existing MinIO upload channel; the new API only orchestrates safe object references.
- Add a portal panel for uploading the three trial files and starting the real pilot bootstrap.
- Bind the configured MaxKB proxy `knowledgeId` as a ready provider reference when the provider status is ready.
- Preserve ZIP manifest extraction as the first material-packet inventory source.
- Document the mature-platform pattern: project/register first, basis/submittal package second, review/human decision/report archive last.
- **BREAKING**: None.

## Capabilities

### New Capabilities

- `opening-condition-single-project-trial-intake`: Operator can bootstrap a single-project opening-condition pilot from real uploaded basis/checklist/ZIP object references.

### Modified Capabilities

- `opening-condition-pilot-intake-orchestration`: Adds a higher-level trial bootstrap wrapper over existing intake/init.
- `opening-condition-pilot-execution-console`: Adds operator-facing real-file trial intake controls.

## Impact

- Affects `server/index.mjs`, `server/openingConditionPilotStore.mjs`, frontend API contracts, opening-condition portal UI, docs, and focused tests.
- Does not add a new storage provider, duplicate file upload transport, or implement full OCR Worker batch ingestion.
