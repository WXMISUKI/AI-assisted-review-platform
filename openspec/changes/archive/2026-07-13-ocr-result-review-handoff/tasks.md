## 1. Spec and Contract

- [x] 1.1 Update `review-session-state` to describe OCR hydration provenance and the review-preparation handoff.
- [x] 1.2 Update `document-review-task` to describe the hydrated review-loading state and fallback visibility.

## 2. Implementation

- [x] 2.1 Surface OCR hydration provenance in the review-loading page.
- [x] 2.2 Keep the task visible with a safe fallback when hydration fails or the OCR result URL is missing.
- [x] 2.3 Keep the hydrated snapshot as the workbench entry source when review-preparation completes.

## 3. Verification

- [x] 3.1 Run `npm run typecheck`.
- [x] 3.2 Inspect parsing, hydrated review-preparation, and failed fallback loading states.
- [x] 3.3 Archive the completed OpenSpec change.
