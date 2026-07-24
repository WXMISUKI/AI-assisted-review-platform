## Why

The opening-condition pilot can already switch among static workspace contexts, but operators still lack a clear registry view of which basis versions, master-data records, knowledge bases, and historical runs belong to each project/review-object/participating-entity context. That gap becomes the next operational risk as soon as one supervisor needs to repeat the pilot across multiple projects or multiple dangerous-subproject objects.

This change adds a workspace asset registry layer so the pilot can scale from "one run works" to "many contexts do not cross-contaminate each other" without jumping early into full multi-tenant permissions or database migration.

## What Changes

- Add an operator-facing workspace asset registry summary for each selectable opening-condition context.
- Derive project-scoped and workspace-scoped asset counts for basis, master data, knowledge base readiness, and historical run presence.
- Show current context asset ownership and neighboring context asset differences on the workspace overview.
- Keep asset switching deliberate and context-safe, making it visible when two workspaces share a project but must not share the same run history or organization-scoped assets.
- Document this as the next production-hardening priority after the unified run-state gates.

## Capabilities

### New Capabilities
- `opening-condition-workspace-asset-registry`: Operator-facing registry of project/workspace asset ownership, readiness, and history isolation.

### Modified Capabilities
- `opening-condition-project-object-model`: Extend project/review-object/participating-entity catalog semantics with workspace asset ownership summaries.
- `opening-condition-context`: Clarify that workspace selection must expose bound asset ownership, not only textual context labels.

## Impact

- Domain catalog derivation in `src/domain/openingConditionReview.ts`
- Workspace overview rendering in `src/productWorkspacePages.tsx`
- Styles in `src/styles/opening-condition.css`
- Next-stage planning document in `docs/opening-condition-next-stage-plan.md`
- No backend API changes, no database migration, no provider contract changes.
