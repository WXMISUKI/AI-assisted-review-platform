## 1. Spec and Contract

- [x] 1.1 Update `review-completion-results` to describe the fallback result shell when the asset is missing.

## 2. Implementation

- [x] 2.1 Allow the result route to render even when the session snapshot does not contain a result asset.
- [x] 2.2 Show a safe fallback shell in `ResultPreviewPage` instead of returning `null`.
- [x] 2.3 Preserve the existing result preview when the asset exists.

## 3. Verification

- [x] 3.1 Run `npm run typecheck`.
- [x] 3.2 Inspect the result route for both completed-with-asset and completed-without-asset cases.
- [x] 3.3 Archive the completed OpenSpec change.


