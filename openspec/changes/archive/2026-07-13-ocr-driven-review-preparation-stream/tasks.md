## 1. Spec and Contract

- [x] 1.1 Define that OCR recovered structure drives review-preparation progress snapshots.
- [x] 1.2 Define review SSE compatibility with structure summary metadata.

## 2. Implementation

- [x] 2.1 Add a domain helper that builds review-preparation stages from recovered structure.
- [x] 2.2 Update loading orchestration to use structure-driven stages after OCR hydration.
- [x] 2.3 Extend review SSE to emit structure-aware stage metadata while preserving connectivity mode.

## 3. Verification

- [x] 3.1 Run TypeScript typecheck.
- [x] 3.2 Run syntax checks for touched backend `.mjs` files.
- [x] 3.3 Archive the completed OpenSpec change.
