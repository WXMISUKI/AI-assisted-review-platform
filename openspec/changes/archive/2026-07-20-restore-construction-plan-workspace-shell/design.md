## Context

The authenticated platform now correctly shows a business launcher, but the construction-plan product still routes directly into `ReviewWorkbenchPage`. That component is a focused review/detail surface, not the full product workspace. The original enterprise shape should be: product launcher -> construction-plan workspace shell -> document library by default -> review workbench when a task is opened.

## Goals / Non-Goals

**Goals:**

- Restore a construction-plan workspace with left sidebar navigation and right-side content.
- Default the product to document library instead of the review workbench.
- Keep review workbench available as a task/detail page.
- Keep shared provider diagnostics under the construction-plan data-assets page.
- Extend MaxKB coordination docs for the external provider team.

**Non-Goals:**

- Do not redesign the review workbench itself in this slice.
- Do not introduce a new upload backend or database.
- Do not fix every legacy garbled string inside deep review cards.
- Do not ask MaxKB to own business classification or final review decisions.

## Decisions

### Decision: Add a product shell wrapper

Create a `ConstructionPlanWorkspaceShell` in the product workspace layer. It owns sidebar navigation state and decides which existing page component to render. This keeps `ReviewWorkbenchPage` focused and avoids duplicating review logic.

Alternative considered: Rebuild `ReviewWorkbenchPage` with a sidebar. This would mix product navigation with document review interaction and increase regression risk.

### Decision: Use a light MVP document/task state

Use a small in-memory document list and the existing `DocumentLibraryPage`, `KnowledgeBasePage`, `DataAssetsPage`, and `ReviewWorkbenchPage` components. This restores the UX structure without reintroducing a large application-state rewrite in this slice.

Alternative considered: Reconstruct the old full App state model. That would be broader and riskier without a source-controlled baseline to diff against.

### Decision: MaxKB remains downstream of platform classification

The MaxKB coordination document will explicitly say the front platform extracts ZIP manifest and classifies files before invoking Worker/Proxy. Provider-side changes should support batch ingestion and retrieval-check, not business decisions.

## Risks / Trade-offs

- The construction-plan document list is MVP state rather than full old persistence -> keep it clear and type-safe, and leave backend session reconnection for a later focused slice.
- Some deep review-workbench labels remain legacy garbled text -> this slice restores navigation shape first; a later copy-cleanup can fix the review workbench internals.
- Dev server may be blocked by local policy -> use `npm run typecheck` as required verification.

