# 施工方案 P2：审查报告 DOCX 导出

变更日期：2026-07-26

## 背景

施工方案 P0 已完成 DOCX 上传解析→问题→决策→resultAsset 闭环。
P2 目标：将 supervisor-report 结果资产导出为可下载 DOCX，复用已有 HTTP Tools html2docx 适配器。

本变更只服务施工方案审查，不改开工条件。

## 架构决策

### D1: 仅导出 supervisor-report
revised-plan-snapshot 格式复杂，后续独立实现。

### D2: 后端纯函数模板
新建 server/reviewReportHtml.mjs，buildReviewReportHtml(asset) 输出语义 HTML。
不引入新模板引擎，与 buildOpeningConditionPilotReportHtml 同风格。

### D3: API 路由
POST /api/review-tasks/:taskId/report/export-docx
后端校验 taskId 有 resultAsset，再调 exportHtmlToDocxUrl，返回 downloadUrl。

### D4: 失败降级
http_tools 不可用或失败时：返回 ok=false + message；
前端结果页展示错误提示，并提供 HTML 下载兜底（blob URL）。

## Requirements

### Requirement: 后端报告 HTML 构建
系统 SHALL 将 SupervisorReportAsset 转为可送入 html2docx 的 HTML。

#### Scenario: 构建 HTML
- WHEN buildReviewReportHtml 接收 supervisor-report 资产
- THEN 输出包含 summary、majorRisks、issueOpinions、rectificationSuggestions、conclusion 的结构化 HTML
- AND 不包含外部 URL、内联图片等非法内容

### Requirement: 导出 API
系统 SHALL 提供 POST /api/review-tasks/:taskId/report/export-docx 端点。

#### Scenario: 正常导出
- WHEN 任务有 resultAsset(type=supervisor-report)
- THEN 调 exportHtmlToDocxUrl，返回 downloadUrl 和 fileName
- AND ok=true

#### Scenario: 无结果资产
- WHEN 任务无 resultAsset
- THEN 返回 400，status=missing_report

#### Scenario: http_tools 不可用
- WHEN exportHtmlToDocxUrl 失败
- THEN 返回 503，status=export_failed，包含 safeDiagnostics

### Requirement: 前端导出 UI
ResultPreviewPage SHALL 提供导出按钮，失败时降级为 HTML 下载。

#### Scenario: 导出成功
- WHEN 用户点击"导出 DOCX 报告"
- THEN 后端返回 downloadUrl，前端打开链接下载

#### Scenario: 导出失败
- WHEN 后端返回失败
- THEN 前端展示错误提示
- AND 提供"下载 HTML 版"兜底按钮

## 修改文件

- server/reviewReportHtml.mjs（新建）
- server/index.mjs（新增端点）
- src/domain/backendConnectivity.ts（新增 API 调用函数）
- src/appShellPages.tsx（ResultPreviewPage 添加导出按钮）
- docs/construction-plan-p0-docx-trial-roadmap.md（补 P2 完成）

## 不做

- revised-plan-snapshot 导出
- 开工条件相关改动
- 全面 UI 重构

## 验证

pnpm typecheck
pnpm smoke:product-boundaries
pnpm smoke:review
pnpm smoke:review:docx
