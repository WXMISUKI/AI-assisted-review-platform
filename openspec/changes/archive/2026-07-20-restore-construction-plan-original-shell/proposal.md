## Why

The construction-plan review product has drifted away from the original enterprise workspace after opening-condition review was added. Users now see an approximate mixed workspace and garbled Chinese copy in core review pages, so the product no longer matches the baseline established before commit `9b4fdb378d124a1ae8b603a6dc67bccbf00bfa60`.

## What Changes

- Restore the construction-plan product from the historical baseline after the authenticated product launcher.
- Preserve the independent opening-condition review portal and shared provider boundaries.
- Replace the approximate construction-plan workspace with a baseline-derived product component that owns the original document-library, knowledge-base, data-assets, loading, detail, and result flow.
- Restore clean Chinese labels and visible construction-plan review copy in shared shell display helpers and the review workbench.
- Keep this slice focused on UI/state restoration; do not redesign backend upload, OCR, MaxKB, or opening-condition flows.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `platform-shell`: Construction-plan review must render through the original-style enterprise workspace after product selection, not through the newer approximate test shell.
- `product-portal-boundary`: Product launcher routing must preserve independent construction-plan and opening-condition workspaces while allowing the construction-plan product to reuse its historical app flow.
- `review-workbench`: Review workbench copy and focused task surface must remain usable when entered from the construction-plan workspace.

## Impact

- Affected frontend: `src/App.tsx`, construction-plan workspace component(s), `src/appShellTypes.ts`, `src/appShellDisplay.tsx`, `src/ReviewWorkbenchPage.tsx`, and related CSS only if required.
- Affected docs/specs: OpenSpec delta specs for product shell and review workbench behavior.
- No new backend API, provider credential, database, or MaxKB proxy requirement is introduced in this slice.
