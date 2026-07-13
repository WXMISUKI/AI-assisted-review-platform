## 1. Spec and Contract

- [x] 1.1 Update `streaming-review-workbench` and `document-review-task` specs to describe structure-aware loading stage display.
- [x] 1.2 Clarify fallback behavior for tasks without recovered structure.

## 2. Implementation

- [x] 2.1 Derive the loading stage set from the selected task's recovered structure in `src/App.tsx`.
- [x] 2.2 Keep the OCR-loading path and non-structured fallback path unchanged.
- [x] 2.3 Make sure the page render path continues to use the same `ReviewLoadingPage` contract.

## 3. Verification

- [x] 3.1 Run `npm run typecheck`.
- [x] 3.2 Inspect the loading page code path for structured and fallback tasks.
- [x] 3.3 Archive the completed OpenSpec change.
