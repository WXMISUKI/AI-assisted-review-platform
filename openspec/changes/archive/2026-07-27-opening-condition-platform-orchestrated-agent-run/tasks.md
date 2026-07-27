## 1. Platform Orchestration

- [x] 1.1 Add a built-in opening-condition checklist extractor for the known 承台施工条件核查表 schema based on the Dify `check_items` contract.
- [x] 1.2 Add a platform orchestration step after trial bootstrap that creates run events, checklist-derived check items, evidence matches, and human-review queue items.
- [x] 1.3 Generate a report-ready task when no blocking human-review items remain, and keep blocking tasks in `awaiting_human_review`.
- [x] 1.4 Add an explicit human-review completion gate so individual decisions are recorded before the task resumes final report generation.

## 2. Frontend Run Experience

- [x] 2.1 Fix the centered chat home layout to auto-fill available shell height without clipping `opening-agent-chat-brand`.
- [x] 2.2 Refresh left task history after upload and bind selected detail to the returned task id instead of the fallback workspace task id.
- [x] 2.3 Restore corrupted Chinese labels in the opening-condition detail surface.
- [x] 2.4 Split the task detail left pane into `资料文档库` and `待核查资料项` groups with review item status chips and focused-detail actions.
- [x] 2.5 Render the progress pane from platform events/state and show report readiness using the requested Markdown report structure.
- [x] 2.6 Add `完成人工复核并生成报告` at the bottom of the human-review queue and disable it while open/deferred blockers remain.

## 3. Verification And Archive

- [x] 3.1 Extend opening-condition store/HTTP/UI smoke tests for platform orchestration and the refreshed detail layout.
- [x] 3.2 Run `openspec validate opening-condition-platform-orchestrated-agent-run --strict`, `npm run typecheck`, `npm run smoke:opening-condition`, `npm run smoke:opening-condition:http`, and `npm run smoke:opening-condition:ui`.
- [x] 3.3 Sync main specs, review scoped diff, and archive the completed OpenSpec change.
