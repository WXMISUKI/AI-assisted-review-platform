## Context

当前开工条件报告导出已经具备以下基础：

- `buildOpeningConditionPilotReportHtml(task)` 能从报告资产生成 bounded HTML；
- `exportHtmlToDocxUrl()` 能调用后端拥有的 `html2docx` 适配器；
- `/api/opening-condition/pilot-tasks/:taskId/report/export-docx` 能执行导出并把结果回写到 `reportAsset.packageDiagnostics.exportHandoff`。

但它和既有报告导出链路相比仍有两个不足：

1. 失败返回没有明确 `fallback: "html"`，调用方无法稳定识别“服务未配置/不可达，但当前页面 HTML 仍可作为临时交付面”；
2. 缺少开工条件专属 export smoke，导致 delivery package rows 是否真被导出链路消费、适配器成功后 handoff 是否回写，都没有独立验收护栏。

## Goals / Non-Goals

**Goals**

- 让开工条件报告导出失败时返回稳定的 bounded failure contract，至少包含 `status`、`adapterStatus`、`fallback`、`message` 和 `safeDiagnostics`。
- 用 smoke 固化导出 HTML 优先消费 persisted delivery package rows。
- 用 smoke 固化适配器成功后 handoff/status/object summary 的回写行为。

**Non-Goals**

- 不新增真正的 `docx2html` 原表回填执行。
- 不改 issue taxonomy 规则，不改报告页整体布局。
- 不接新的 provider，不做多租户或数据库迁移。

## Decisions

### 1. 失败 contract 与既有报告导出保持同一语义层

决定：

- 开工条件导出失败时统一返回 `status: "export_failed"`；
- 同时补充 `adapterStatus` 和 `fallback: "html"`；
- `safeDiagnostics` 继续只保留 bounded 适配器状态，不暴露私有 URL、原始 HTML 或内部 header。

原因：

- 调用方只需要知道“导出器为什么不可用”和“现在是否该回退到 HTML/页面交付”，不需要知道内部实现细节。

### 2. 导出 HTML 只读 delivery package rows，findings 仅作兼容回退

决定：

- `buildOpeningConditionPilotReportHtml` 继续优先读取 `packageDiagnostics.deliveryPackage.rows`；
- 仅当持久化行不存在时，才回退到 `findings` 推导导出表格行；
- smoke 直接断言 HTML 使用 persisted row 文案。

原因：

- 这能保证导出器消费的是平台已经确认过的结构化交付事实，而不是每次导出又临时重算一遍。

### 3. 用开工条件专属 export smoke 守住 API + adapter + handoff 三层

决定：

- 新增独立 smoke 覆盖：
  - 缺少 report asset；
  - `HTTP_TOOLS_BASE_URL` 未配置；
  - stub `html2docx` 成功返回；
  - HTML 包含 persisted delivery package row 文案；
  - 回写后的 `exportHandoff` / `reportAsset.objectRef` / `deliveryPackage.adapterStatus` 语义正确。

原因：

- 这比只靠 store unit test 更贴近真实投产链路，也能挡住 API 语义回退。

## Risks / Trade-offs

- [风险] 现在把失败统一标成 `fallback: "html"`，可能让人误以为系统自动生成了正式 HTML 下载件。
  -> Mitigation：前端状态文案只表达“可回退到页面/HTML 交付语义”，不伪装成正式导出成功。

- [风险] 新 smoke 需要 stub HTTP 服务，测试代码会略多。
  -> Mitigation：保持在单文件内完成，复用现有 listen/requestJson 辅助函数，不引入额外测试框架。
