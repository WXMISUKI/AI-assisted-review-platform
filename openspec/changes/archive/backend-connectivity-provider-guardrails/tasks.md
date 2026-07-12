## 1. Spec and Contract

- [x] 1.1 Define the provider readiness summary and safe diagnostics contract for health and status endpoints.
- [x] 1.2 Clarify the stream start, stage, and completion boundaries for review SSE.

## 2. Implementation

- [x] 2.1 Normalize backend provider readiness helpers and return shapes for LLM, OCR, and MinIO.
- [x] 2.2 Update review SSE and OCR submission paths to emit or consume the normalized contract.
- [x] 2.3 Keep frontend connectivity panels and upload flows compatible with the updated backend responses.

## 3. Verification

- [x] 3.1 Run typecheck.
- [x] 3.2 Archive the change and sync the spec.
