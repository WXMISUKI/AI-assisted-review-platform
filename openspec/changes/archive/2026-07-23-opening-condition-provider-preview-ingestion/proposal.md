## Why

The platform now has a governed `Basis Preview` contract, but the candidate facts still mostly come from metadata or manually supplied bounded text. For a production trial, OCR/Provider structured outputs must be able to feed the same preview contract without bypassing human confirmation, publication governance, or platform-owned audit records.

## What Changes

- Add a provider preview ingestion path that accepts safe OCR/Provider structured facts for opening-condition basis records.
- Normalize provider facts into the existing `Basis Preview` shape with provenance, missing fields, confidence, and next action.
- Keep provider output provisional: provider-derived facts must return the basis to `needs_confirmation` and cannot be published until human confirmed.
- Expose a workspace basis action API for provider preview ingestion.
- Add focused smoke coverage for provider output -> preview -> confirm -> publish -> run readiness.

## Capabilities

### New Capabilities
- `opening-condition-provider-preview-ingestion`: governs how OCR/Provider structured outputs become provisional basis preview facts.

### Modified Capabilities
- `opening-condition-basis-preview-extraction`: adds provider structured output as an accepted safe input source for preview refresh.
- `external-provider-integration-contracts`: clarifies that provider extraction output is normalized into platform-owned preview records before influencing opening-condition readiness.
- `opening-condition-publication-governance`: surfaces provider provenance and confirmation requirements for provider-derived previews.

## Impact

- Backend: `server/openingConditionPilotStore.mjs`, `server/index.mjs`, smoke tests.
- Frontend/domain: `src/domain/backendConnectivity.ts`, `src/domain/openingConditionPilot.ts`, `src/productWorkspacePages.tsx`, `src/App.tsx`.
- Docs/specs: runbook and roadmap should record provider-preview semantics.
- No new external dependency, queue worker, OCR batch job, or database migration in this slice.
