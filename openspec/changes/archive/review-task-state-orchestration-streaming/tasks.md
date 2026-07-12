## 1. Spec and Contract

- [x] 1.1 Define the shared review task lifecycle snapshot and orchestration contract in the domain layer.
- [x] 1.2 Clarify the lock/unlock rules for OCR processing, review streaming, and ready states.

## 2. Implementation

- [x] 2.1 Add or extract a domain orchestration helper that normalizes OCR, recovery, review, ready, completed, and failed states.
- [x] 2.2 Update the review session service and loading flow to consume the shared orchestration contract.
- [x] 2.3 Keep document library and workbench surfaces reading the same snapshot without changing existing user-facing behavior.

## 3. Verification

- [x] 3.1 Run typecheck.
- [x] 3.2 Archive the change and sync the spec.
