## 1. Backend Master-Data Preview Contract

- [x] 1.1 Extend master-data normalization with bounded preview facts, source evidence, missing fields, lifecycle label, readiness group, and next action.
- [x] 1.2 Refine master-data decision handling so approve/confirm, publish, and reject preserve safe audit metadata and keep current-run confirmation distinct from reusable publication.
- [x] 1.3 Refresh preflight diagnostics so missing, provisional, current-run confirmed, and published master data produce operator-facing readiness details.

## 2. Frontend Candidate Governance

- [x] 2.1 Update the intake preview master-data candidate panel to show source evidence, candidate facts, missing fields, confidence, lifecycle meaning, and next action.
- [x] 2.2 Update the basis/master-data governance page to distinguish current-run usable snapshot, pending candidates, publish-ready records, published catalog, and exceptions using operator-facing labels.
- [x] 2.3 Replace raw or confusing master-data labels such as `current_run` and unexplained `human_approved` where they appear in user-facing copy.

## 3. Verification And Spec Closure

- [x] 3.1 Add or update focused backend tests for master-data decision lifecycle and readiness diagnostics.
- [x] 3.2 Run targeted validation: `openspec validate opening-condition-master-data-candidate-preview-governance`, `pnpm typecheck`, and the opening-condition smoke checks affected by this contract.
- [x] 3.3 Sync the delta specs into main specs and archive the change after implementation is complete.
