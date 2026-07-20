## 1. Baseline Extraction

- [x] 1.1 Extract construction-plan source snapshots from commit `9b4fdb378d124a1ae8b603a6dc67bccbf00bfa60`.
- [x] 1.2 Identify the minimal baseline files needed to restore construction-plan workspace behavior without replacing the product launcher.

## 2. Construction-Plan Workspace Restoration

- [x] 2.1 Add a baseline-derived construction-plan product component that owns document library, knowledge base, data assets, review loading, review detail, and review result flow.
- [x] 2.2 Route `construction-plan-review` from `src/App.tsx` to the restored component while keeping opening-condition review independent.
- [x] 2.3 Remove or bypass the approximate construction-plan shell that mixed simplified/demo content into the product.

## 3. Copy And Display Cleanup

- [x] 3.1 Restore clean UTF-8 Chinese role, page, status, pipeline, agent, and helper labels used by the construction-plan shell.
- [x] 3.2 Restore readable construction-plan review workbench copy for filters, modes, dialogs, issue cards, and manual annotation actions.

## 4. Verification

- [x] 4.1 Run TypeScript typecheck.
- [x] 4.2 Inspect the implementation delta to confirm no backend provider, MaxKB, or opening-condition workflow behavior was changed unintentionally.

## 5. Archive

- [x] 5.1 Mark all tasks complete after verification.
- [x] 5.2 Archive the OpenSpec change.
