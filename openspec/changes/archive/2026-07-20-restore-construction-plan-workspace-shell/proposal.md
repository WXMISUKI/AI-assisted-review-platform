## Why

Construction-plan review currently opens directly into the review workbench, which bypasses the original enterprise shell with left navigation and document-library entry. This makes the product feel like a single demo screen instead of a normal review platform.

## What Changes

- Restore construction-plan review as an independent product workspace after the business selection portal.
- Make the construction-plan workspace default to the document library instead of the review workbench.
- Provide left-side navigation for document library, knowledge base, data assets, and review workbench access.
- Keep the review workbench available as the focused document review area, entered from the workspace rather than as the product landing page.
- Extend the MaxKB material-packet coordination documentation with explicit provider-side changes needed for ZIP packages and mixed file types.

## Capabilities

### New Capabilities

### Modified Capabilities
- `platform-shell`: Construction-plan review must render through its product shell and not directly through a single review page.
- `product-portal-boundary`: Product selection must route each product to its own workspace, including a restored construction-plan workspace.
- `review-workbench`: Review workbench remains a task/detail surface and must not be the default product landing screen.
- `maxkb-material-packet-coordination`: Provider-side cooperation requirements must explicitly cover ZIP manifest handoff, mixed file type routing, and batch ingestion/retrieval-check expectations.

## Impact

- Affected frontend: `src/App.tsx`, `src/productWorkspacePages.tsx`, `src/appShellTypes.ts`, `src/appShellDisplay.tsx`, `src/styles.css`.
- Affected docs: `docs/maxkb-material-packet-coordination.md`.
- No backend API changes are required for restoring the construction-plan shell.
- No new provider credentials are required.
