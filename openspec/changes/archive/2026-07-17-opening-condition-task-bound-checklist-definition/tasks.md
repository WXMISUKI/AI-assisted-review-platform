## 1. Spec And Domain Model

- [x] 1.1 Create OpenSpec proposal, design, and delta specs for task-bound checklist definitions.
- [x] 1.2 Extend the pilot task domain model with a persisted checklist-definition field.

## 2. Backend Checklist Ownership

- [x] 2.1 Persist checklist-definition items during intake/init and task normalization.
- [x] 2.2 Allow formal match to use stored checklist-definition items when request-level items are omitted.
- [x] 2.3 Add focused backend tests for persisted checklist definitions and match replay.

## 3. Frontend Wiring

- [x] 3.1 Send checklist-definition items during intake/init.
- [x] 3.2 Run formal match against stored task definitions by default.

## 4. Validation And Archive

- [x] 4.1 Run targeted typecheck and pilot-store tests.
- [x] 4.2 Sync main specs/docs and archive the completed change.
