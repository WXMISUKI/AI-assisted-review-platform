## Context

The repository already has a shared React/Vite shell, shared provider adapters, construction-plan review domain types, and opening-condition pilot APIs. The current implementation has grown through vertical slices, leaving several large page/store modules and duplicated view/state logic. The platform must now support parallel MVP work without changing the existing business behavior that has already been tested manually.

The main constraints are:

- Keep the current Node BFF and file-backed/local MVP behavior.
- Do not introduce a database migration, authentication redesign, or new runtime dependency.
- Preserve existing endpoint and export contracts.
- Make the next refactor incremental and reversible.
- Keep the shared shell neutral; product-specific workflow state must remain in product-owned modules.

## Goals / Non-Goals

**Goals:**

- Establish a documented shared-vs-specific responsibility matrix.
- Create explicit product boundary modules for route identity, state ownership, and test entry points.
- Move reusable status labels, action metadata, and feature-independent UI primitives into shared modules.
- Make stylesheet layering enforceable without rewriting all existing CSS.
- Add a lightweight governance audit and smoke coverage before parallel feature work.
- Define two independently testable MVP slices.

**Non-Goals:**

- Rewriting `productWorkspacePages.tsx` or `openingConditionPilotStore.mjs` in one change.
- Replacing local fallback persistence with PostgreSQL.
- Building full multi-tenant permissions.
- Implementing all twelve issue-class agents or legal-regulation automation.
- Redesigning the complete visual system.

## Decisions

1. **Use three explicit layers.**
   - Shared platform: product launcher, shell, theme tokens, provider adapters, object references, report/export handoff, and bounded activity records.
   - Construction-plan product: document task, OCR/preparation, review issue lifecycle, result asset, revised-plan snapshot.
   - Opening-condition product: workspace context, basis/master-data gates, packet/checklist matching, human review, rectification rerun, archive, and DOCX export.
   This is preferred over a single cross-product workflow because the two products have different business aggregates and terminal states.

2. **Use domain modules as state owners.**
   Page components may own transient view state such as selected tab, dialog visibility, and loading indicators. Durable task/run/report state must be read and mutated through product domain services. This is preferred over a global store because the current MVP has no shared persistence transaction boundary.

3. **Refactor by seams, not by file size alone.**
   First extract stable contracts, mappings, and shared primitives. Then split large files one vertical slice at a time. This is preferred over a broad rewrite because the opening-condition flow has already passed real manual testing.

4. **Keep one stylesheet entry with layered imports.**
   Global tokens and base rules remain global. Shared component rules belong to shared style modules. Product rules belong to `src/styles/opening-condition.css` or a construction-plan feature stylesheet. This is preferred over CSS modules or a new styling dependency for the current MVP.

5. **Test product boundaries through behavior.**
   Use existing Node smoke tests plus small source-level boundary checks and `pnpm typecheck`. Browser automation is not required for this governance slice; manual UI verification remains the acceptance step for layout-sensitive changes.

## Risks / Trade-offs

- **Risk:** Extracting code from large files can introduce behavior changes. → **Mitigation:** preserve existing exports, move pure helpers first, run typecheck and domain smoke after every slice.
- **Risk:** Shared abstractions become another dumping ground. → **Mitigation:** only place code in shared modules when both products use the same contract and semantics.
- **Risk:** A single root CSS entry remains large. → **Mitigation:** establish layered imports and stop adding new feature rules to the monolith; migrate only touched blocks.
- **Risk:** Product MVPs evolve at different speeds. → **Mitigation:** each product receives an independent acceptance checklist and test namespace.
- **Risk:** Current mock/local fallback behavior is accidentally removed. → **Mitigation:** keep fallback adapters and explicitly test provider-unavailable paths.

