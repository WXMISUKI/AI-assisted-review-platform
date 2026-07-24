## Why

The platform now contains two business portals with different review semantics, but their shared shell, state handling, styles, and page composition are still unevenly organized. The oversized page/store modules and mixed local/backend state make parallel delivery risky: a change for construction-plan review can accidentally alter opening-condition behavior, and visual changes can bypass the existing style governance.

This change establishes the smallest enterprise-oriented boundary needed before parallel MVP delivery: explicit shared platform contracts, independent product MVP contracts, a code-governance baseline, and verification gates that prove the two portals remain isolated.

## What Changes

- Define the shared platform layer for product launch, shell layout, theme tokens, provider adapters, document/object references, report handoff, and bounded activity summaries.
- Define the independent MVP boundary for construction-plan review: document intake, OCR/preparation, AI/manual issue review, result asset, and revised-plan snapshot.
- Define the independent MVP boundary for opening-condition review: workspace context, basis/master-data preflight, packet/checklist matching, human review, rectification rerun, report asset, archive, and DOCX export.
- Establish a source-of-truth rule for state: product-owned domain state remains in domain/service modules; page components only coordinate view state and rendering.
- Establish a staged refactor rule for oversized modules: extract shared contracts and feature boundaries first, then split implementation incrementally without changing business behavior.
- Make style ownership explicit: semantic tokens and shared primitives are global; construction-plan and opening-condition styles are feature-owned; one-off colors and duplicate status mappings are disallowed.
- Add verification coverage for portal isolation, archived-run read-only behavior, construction-plan review lifecycle, opening-condition lifecycle, and type safety.
- Preserve current MVP fallback behavior when backend/provider services are unavailable.

## Capabilities

### New Capabilities

- `dual-portal-mvp-boundaries`: Defines the minimum independently testable product contracts and the shared-vs-specific responsibility matrix for both portals.
- `platform-code-governance`: Defines module ownership, state ownership, style ownership, component boundaries, and verification rules for safe parallel development.

### Modified Capabilities

- `product-portal-boundary`: Strengthen portal isolation so each portal has an explicit MVP route, state, navigation, and test boundary.
- `platform-style-governance`: Strengthen stylesheet layering and shared token/component ownership for parallel feature development.

## Impact

- Frontend: `src/App.tsx`, `src/ConstructionPlanReviewApp.tsx`, `src/productWorkspacePages.tsx`, `src/appShellPages.tsx`, `src/domain`, `src/styles.css`, and feature styles.
- Backend: opening-condition pilot store/API contracts and construction-plan review task/run contracts.
- Tests: existing opening-condition smoke tests and new boundary-focused lightweight tests.
- Documentation: development standards, architecture notes, and a two-portal MVP runbook.
- No new runtime dependency, database migration, authentication model, or provider replacement is introduced by this change.
