## Why

The opening-condition platform now has platform-owned task orchestration, but the selected-task surface is still an in-between state: the sidebar can overflow its shell, the detail page renders a preview shell before the operator asks for one, document-library clicks do not switch into a dedicated preview mode, and checklist items still jump away from the task workbench instead of closing human review in place. This makes the MVP feel unlike the mature review platform the operators already know.

## What Changes

- Turn the selected-task detail into an explicit workbench with three modes: checklist list, document preview, and human-review detail.
- Keep `资料文档库` and `待核查资料项` as the default collapsed list surface, then switch the whole left/middle work area into preview or review-detail mode after a click.
- Show every extracted material-review checklist item in the list, with backend-backed statuses such as `已匹配`、`待人工复核`、`已核查`、`未匹配`.
- Add an in-place human-review detail panel with file preview, AI review context, operator note input, accept/reject/correct/defer actions, and a completion path that returns to the list and updates state immediately.
- Tighten shell/sidebar/detail sizing so the workspace uses flexible widths and auto-growing heights instead of fixed overflow-prone dimensions.

## Impact

- Frontend: opening-condition shell layout, selected-task state model, preview flow, human-review detail flow, and shared styles.
- App wiring: pass human-review notes and completion actions through the workspace page without leaving the task workbench.
- Specs: opening-condition execution console requirements for workbench modes and in-place review closure.
