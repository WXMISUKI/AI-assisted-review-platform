## Context

The imported Dify workflow provides a useful product model:

```text
审查表格json输出
-> 准备审查任务列表
-> 单材料审查批处理
-> 审查结果回填
-> 最终报告生成节点
```

For this MVP, the platform owns the task state, events, checklist items, matching result, human-review queue, and report asset. The workflow is a schema and prompt reference, not a runtime dependency.

## Goals

- After uploading basis, checklist, and material ZIP, the platform creates a visible task and refreshes the left history list immediately.
- The task advances beyond `packet_uploaded` through a deterministic platform run that produces checklist-derived items and matching statuses.
- The detail page separates source files from review items.
- The progress panel shows current workflow stages and report readiness from task facts.
- Report asset text follows the requested opening-condition Markdown report structure.

## Non-Goals

- No production LLM/Dify invocation in this slice.
- No full PDF/DOCX viewer integration in this slice; keep a document-library structure and source object preview entry points ready for a later viewer slice.
- No formal database migration or RBAC expansion.
- No full twelve-type compliance model beyond safe deterministic item status and human-review queue generation.

## Decisions

1. **Use platform deterministic orchestration first.**
   - `trial-bootstrap` will remain the upload entry.
   - After intake data is available, a platform orchestrator creates run events and advances to `awaiting_human_review` or `report_ready`.
   - This avoids a UI-only fake progress bar and keeps facts in `.local-data/opening-condition-pilot-tasks.json`.

2. **Map Dify `check_items` to existing checklist/check item shapes.**
   - Dify fields map as:
     - `item_id` -> checklist/check item id suffix.
     - `category`, `sub_category`, `content` -> category/subCategory/name.
     - `materials` -> expected evidence hints.
     - `is_mandatory` -> risk/severity and report criticality.
     - `match_files`, `is_pass`, `remark` -> match/evidence/verdict fields.
   - For the known “承台施工条件核查表” MVP, derive a stable built-in checklist definition that mirrors the workflow schema.

3. **Treat files and review items as separate UI concepts.**
   - `资料文档库`: basis object, checklist object, material ZIP object, and inventory entries.
   - `待核查资料项`: checklist-derived items with `未匹配`, `已匹配`, or `待人工审核`.
   - Clicking a review item can route to focused check/human-review detail using existing focused-detail routes.

4. **Refresh by returned task id.**
   - Upload completion sets current task directly from `result.task`.
   - Then it refreshes workspace task list and registry.
   - Avoid fetching the default `oc-pilot-<workspaceId>` id when no task exists.

5. **Report generation remains source-bound.**
   - Report summary is derived from task check items and human-review queue.
   - The report states internal AI-assisted status and does not claim deep compliance review when only completeness was selected.

## Risks

- Built-in checklist extraction is template-based for the current MVP. It must be clearly marked as platform deterministic extraction, not a general parser.
- Auto-advancing too far could bypass human review. The orchestrator should leave missing or uncertain items in the human-review queue instead of auto-passing them.
- Viewer reuse is intentionally deferred to keep this slice shippable.

## Verification

- Store smoke verifies upload orchestration creates checklist-derived items, evidence/matches, human-review queue, events, and report-ready transitions.
- HTTP smoke verifies trial bootstrap returns an advanced task and task list contains it.
- UI smoke verifies no default-id 404 dependency, history refresh wiring, clean Chinese labels, document library/review item split, and adaptive chat-home classes.
- Typecheck validates frontend contracts.
