## Why

The highest-value next step is to turn the opening-condition pilot from a well-modeled backend store into an operable single-project trial flow. Provider contracts and preflight gates are now in place, but users still need a clear way to list/create pilot tasks, manage subcontract-team knowledge bases, bind them to tasks, and see readiness before formal material matching.

This is more valuable for near-term delivery than deeper RAGFlow tuning, full RBAC, or database migration because it makes the existing preflight, evidence, human-review, and report workflow usable in a real demo without requiring new infrastructure.

## What Changes

- Add operational API routes for opening-condition knowledge bases:
  - list knowledge bases by workspace
  - upsert a subcontract-team knowledge base
  - bind a knowledge base to a pilot task
- Add a readiness API endpoint for a pilot task so the frontend can show blocking reasons without re-running formal matching.
- Expose frontend client functions and typed DTOs for pilot tasks, knowledge bases, binding, and readiness.
- Add a concise operational panel in the opening-condition portal showing backend-backed task readiness and knowledge-base support state.
- Document the recommended next-stage direction: prioritize single-project pilot operability over local optimization, full tenant/RBAC, and deeper RAGFlow-specific workflows.
- Keep RAGFlow optional; no new external configuration is required for this change.

## Capabilities

### New Capabilities

- `opening-condition-pilot-operational-api`: API and UI contract for operating the single-project opening-condition pilot through task readiness, knowledge-base management, and task knowledge-base binding.

### Modified Capabilities

- `opening-condition-pilot-workflow`: Formal pilot workflow gains operational routes for readiness inspection and knowledge-base binding before material matching.
- `opening-condition-preflight-knowledge-base`: Subcontract-team knowledge-base records gain API-level list/upsert/bind behavior for single-project trial use.

## Impact

- Affected backend: `server/index.mjs`, `server/openingConditionPilotStore.mjs`, focused backend tests.
- Affected frontend: `src/domain/backendConnectivity.ts`, `src/appShellPages.tsx`, opening-condition portal operational display.
- Affected docs/specs: opening-condition pilot workflow docs, OpenSpec main specs after archive.
- No new provider config is needed. Existing optional RAGFlow configuration remains supported but not required.
