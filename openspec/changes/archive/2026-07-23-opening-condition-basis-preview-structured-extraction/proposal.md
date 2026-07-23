## Why

The basis preview added in the previous slice explains what the platform intends to publish, but it still depends on manually assembled preview facts. That is not enough for a production trial: the platform needs a deterministic way to derive structured candidate facts from uploaded basis files so supervisors can review, confirm, and publish them with less ambiguity.

## What Changes

- Add a structured basis-preview extraction path that derives candidate facts from basis source metadata and bounded preview text.
- Keep extracted values safe and provisional until an operator confirms them.
- Expose a basis preview extraction action through the workspace basis governance API.
- Make trial bootstrap and intake preview use the same extraction model so preview semantics stay consistent across pages.
- Add smoke coverage for extraction -> confirm -> publish -> run readiness.

## Capabilities

### New Capabilities

- `opening-condition-basis-preview-extraction`: derive structured basis preview facts from uploaded basis sources and safe bounded text.

### Modified Capabilities

- `opening-condition-basis-workflow`: basis preview records gain deterministic extraction provenance and derived facts.
- `opening-condition-publication-governance`: governance pages show extracted preview facts and extraction status for basis records.
- `opening-condition-intake-preview-and-publish-gate`: intake gate reflects the extracted preview facts and next action before matching.

## Impact

- Affected backend: `server/openingConditionPilotStore.mjs`, `server/index.mjs`, retained smoke tests.
- Affected frontend: `src/domain/backendConnectivity.ts`, `src/domain/openingConditionPilot.ts`, `src/productWorkspacePages.tsx`.
- Affected docs: runbook and production roadmap.
- No new provider dependency or database migration.
