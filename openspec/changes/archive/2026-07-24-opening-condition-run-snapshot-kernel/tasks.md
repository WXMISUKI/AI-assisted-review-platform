## 1. Snapshot Kernel

- [x] 1.1 Add a shared run-snapshot helper module that derives visible history, selected run, current-run status, and rerun-entry availability for workspace report/history views.
- [x] 1.2 Move rectification-closure and selected-run supporting derivations onto shared final-disposition helpers so "pending human judgement" only means truly unresolved review items.

## 2. Report And Archive Integration

- [x] 2.1 Refactor `OpeningConditionReportDeliveryWorkbench` to use the shared run-snapshot kernel instead of duplicating selected-run/history semantics.
- [x] 2.2 Refactor `OpeningConditionReportArchivePage` to use the same run-snapshot kernel and align rerun-entry behavior with the report workbench.
- [x] 2.3 Keep only the approved current-archived-run rerun entrance while preserving historical rounds as read-only drill-in views.

## 3. Verification And Docs

- [x] 3.1 Update lightweight UI smoke to assert shared run-snapshot semantics and normalized pending-human behavior.
- [x] 3.2 Update `docs/opening-condition-next-stage-plan.md` with this next-step priority after workspace asset isolation.
- [x] 3.3 Run `npm run smoke:opening-condition:ui`.
- [x] 3.4 Run `npm run typecheck`.
- [x] 3.5 Run `openspec validate --changes opening-condition-run-snapshot-kernel`.
