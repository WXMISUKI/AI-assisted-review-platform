## 1. Specification

- [x] 1.1 Capture the next-batch direction for human-review-aware reports, out-of-scope checklist filtering, and unified history deletion semantics.
- [x] 1.2 Validate the OpenSpec change artifacts before implementation.

## 2. Backend Report Alignment

- [x] 2.1 Update final Markdown report generation to use human-review-aware report findings.
- [x] 2.2 Include operator safe notes and review status in reportable finding descriptions where applicable.
- [x] 2.3 Add or update backend tests for accepted, corrected, and rejected human-review report outcomes.

## 3. Frontend Workbench Alignment

- [x] 3.1 Filter out out-of-scope/not-applicable checklist rows from the selected-task `待核查资料项` list.
- [x] 3.2 Unify report/history visible actions around backend deletion and final report delivery wording.
- [x] 3.3 Update UI smoke tests to cover out-of-scope filtering and unified copy/action expectations.

## 4. Verification and Archive

- [x] 4.1 Run lightweight TypeScript and targeted opening-condition tests.
- [x] 4.2 Sync completed specs and archive the change after all tasks pass.
