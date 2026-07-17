## 1. Preflight Readiness Model

- [x] 1.1 Add opening-condition preflight readiness types covering basis, master data, subcontract knowledge base, material packet, and blocking reasons.
- [x] 1.2 Extend the backend pilot store normalization with optional preflight readiness and knowledge-base references while preserving existing task compatibility.
- [x] 1.3 Add deterministic readiness derivation for workspace/task state instead of relying on ad hoc frontend labels.

## 2. Subcontract-Team Knowledge Base

- [x] 2.1 Add organization/contract-package/subcontract-team knowledge-base records to the local pilot store.
- [x] 2.2 Support binding a knowledge base to an opening-condition workspace or pilot task.
- [x] 2.3 Store reusable safe summaries for templates, historical evidence, extraction notes, human corrections, and master-data references without treating vector recall as a fact source.

## 3. Formal Review Gate Enforcement

- [x] 3.1 Block formal checklist matching when the task lacks a published basis version.
- [x] 3.2 Block or mark affected items when required master data is missing, provisional, rejected, or expired.
- [x] 3.3 Surface missing knowledge-base binding as a readiness blocker or provisional warning according to the pilot workflow policy.

## 4. Opening-Condition Portal UX

- [x] 4.1 Refresh demo data to show a workspace with published basis, published master data, bound knowledge base, and readiness state.
- [x] 4.2 Add a concise readiness panel to the opening-condition portal showing what is ready, what is blocked, and what action is next.
- [x] 4.3 Rename any remaining Dify-centric human-review wording to platform-first workflow wording in the opening-condition portal.

## 5. Verification And Archive Preparation

- [x] 5.1 Add focused backend tests for preflight readiness, knowledge-base binding, and formal-review blocking.
- [x] 5.2 Run targeted validation: backend node test, `node --check` for changed `.mjs`, and `npm run typecheck`.
- [x] 5.3 Sync final spec deltas into main specs and archive the change after implementation is complete.
