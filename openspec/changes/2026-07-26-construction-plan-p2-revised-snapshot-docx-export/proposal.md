## Why

施工方案审查当前已经具备：

- `supervisor-report` 的 DOCX 导出闭环
- `revised-plan-snapshot` 的结果资产生成与结果页展示

但第二类结果资产仍停留在“页面可看、不能导出”的状态。对于真正投产来说，这会造成一个明显断层：

- 审核模式可以交付 DOCX
- 审改模式只能看页面，不能形成可下载的交付物

如果继续在 supporting evidence 主线上做更多局部优化，会开始出现收益递减；而补齐 `revised-plan-snapshot` 导出，能更直接提升结果交付完整性。

## What Changes

- 为 `revised-plan-snapshot` 新增后端 HTML 构建与 DOCX 导出支持
- 复用现有 `POST /api/review-tasks/:taskId/report/export-docx` 路由
- 结果页在 `revised-plan-snapshot` 下也提供 DOCX 导出与 HTML fallback

## Capabilities

### Modified Capabilities

- `review-completion-results`: `revised-plan-snapshot` 结果资产也可通过现有 backend-owned adapter 导出
- `document-review-task`: 结果导出接口从仅支持 `supervisor-report` 扩展为同时支持 `revised-plan-snapshot`

## Impact

- Backend:
  - `server/reviewReportHtml.mjs`
  - `server/index.mjs`
- Frontend:
  - `src/appShellPages.tsx`
  - `src/domain/backendConnectivity.ts`
- Verification:
  - `server/reviewReportExportSmoke.test.mjs`
