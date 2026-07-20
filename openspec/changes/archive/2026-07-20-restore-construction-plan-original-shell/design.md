## Context

The platform now has a unified login and product launcher, which is the correct boundary for hosting multiple review products. The problem is inside the construction-plan product: after opening-condition work was added, the original construction-plan workspace was replaced by an approximate shell and several shared display files contain mojibake copy.

The historical commit `9b4fdb378d124a1ae8b603a6dc67bccbf00bfa60` is the source of truth for the construction-plan product shape before opening-condition review was introduced.

## Goals / Non-Goals

**Goals:**

- Restore the construction-plan product as a baseline-derived enterprise workspace.
- Keep login and product selection as the only shared cross-product entry.
- Preserve opening-condition review as an independent product workspace.
- Restore visible construction-plan Chinese labels and review workbench copy that were damaged by encoding drift.
- Keep verification lightweight with TypeScript typecheck.

**Non-Goals:**

- Do not remove the product launcher.
- Do not merge opening-condition pages into the construction-plan sidebar.
- Do not change backend provider contracts, object storage, OCR, LLM, or MaxKB behavior in this slice.
- Do not introduce a full multi-tenant permission platform.

## Decisions

### Decision: Baseline-derived component instead of approximate shell

Create a construction-plan product component from the old commit's `src/App.tsx` flow, adapted to receive an existing authenticated session and a return-to-products action. This keeps the original document library, loading, detail, and result flow together.

Alternative considered: continue improving `ConstructionPlanWorkspaceShell` in `productWorkspacePages.tsx`. That shell is already a simplified reimplementation and would keep drifting from the baseline the user explicitly named.

### Decision: Keep outer App as product host

The current `src/App.tsx` remains responsible for theme, login session, and product selection. When the active product is construction-plan review, it delegates to the restored construction-plan app component. When active product is opening-condition review, it keeps using the opening-condition workspace.

Alternative considered: replacing current `src/App.tsx` with the old commit wholesale. That would break the product launcher and opening-condition independent entry.

### Decision: Restore garbled visible labels from the baseline and current domain types

Shared shell label helpers and review workbench text are restored to clean UTF-8 Chinese. This is required because the construction-plan UI cannot be considered restored while its main copy is unreadable.

Alternative considered: leave deep workbench copy for a later cleanup. That was already tried in the previous archived change and did not meet the user's acceptance bar.

## Risks / Trade-offs

- Baseline app code is larger than the newer approximate shell -> keep it isolated in its own construction-plan component and avoid touching opening-condition code.
- Old code may not know about newer service fields -> adapt at the boundary and keep existing domain/service helpers where possible.
- A full visual browser comparison may be slower than needed for this slice -> use typecheck as the required lightweight verification and keep code changes scoped.

## Migration Plan

1. Extract relevant source files from commit `9b4fdb378d124a1ae8b603a6dc67bccbf00bfa60`.
2. Add or restore a construction-plan product component based on the old app flow.
3. Route the product launcher to that component while preserving opening-condition routing.
4. Restore clean shell/review labels.
5. Run `npm run typecheck`.
6. Archive the OpenSpec change after all tasks pass.

## Open Questions

None for this restoration slice. Future work can separately decide whether to modularize the restored construction-plan app after its original behavior is back.
