# 施工方案 P0 收口：规则兜底可审查提示与锚点验收

变更日期：2026-07-26

## 背景

DOCX 同步解析与问题落库已贯通，但仍有两处投产摩擦：

1. LLM 空/失败时，用户不知道当前问题来自规则兜底，误以为“审查没跑完”。
2. 锚点定位虽有实现，但缺少基于真实 DOCX 段落 ID 的回归验收。

本变更只服务施工方案审查，不改开工条件。

## 架构决策

### D1: 用现有 reviewGenerationRun 承载来源诊断
DOCX 同步落库后，立即写入 reviewGenerationRun：
- 有 LLM issues：status=ready 或 degraded（若混入规则）
- 仅规则 issues：status=degraded
- diagnostics.message 明确“规则兜底可审查”

### D2: 双表面提示
- 文档库：复用 getGenerationRunSummaryLabel 的 degraded 文案
- 工作台：顶部 banner 明确来源与可继续人工审查

### D3: 锚点验收进 smoke
DOCX smoke 校验 rule issues 的 anchor.paragraphId 存在于 recoveredStructure.paragraphs。

## Requirements

### Requirement: DOCX 同步写入生成诊断
当 DOCX 解析完成并生成 issues 时，系统 SHALL 写入可展示的 generation diagnostics。

#### Scenario: 仅规则问题
- WHEN DOCX 结果只有规则 issues
- THEN reviewGenerationRun.status = degraded
- AND diagnostics.message 说明规则兜底可审查

#### Scenario: 混合问题
- WHEN 同时有 LLM 与规则 issues
- THEN reviewGenerationRun 标记 ready 或 degraded
- AND diagnostics/message 说明混合来源

### Requirement: 工作台可见规则兜底
ReviewWorkbenchPage SHALL 在 generation 诊断为 fallback/degraded 时显示顶部提示。

#### Scenario: 打开已降级任务
- WHEN 用户打开含 degraded generationRun 的任务工作台
- THEN 顶部显示“规则兜底可审查”类提示
- AND 不阻塞 accept/reject/complete

### Requirement: 锚点可定位验收
DOCX smoke SHALL 验证问题锚点段落存在。

#### Scenario: 规则问题锚点
- WHEN 从测试 DOCX 生成 rule issues
- THEN 每个 issue.anchor.paragraphId 对应 recoveredStructure 中某段落

## 修改文件

- src/ConstructionPlanReviewApp.tsx
- src/ReviewWorkbenchPage.tsx
- src/domain/reviewSessionService.ts
- src/domain/reviewTypes.ts
- server/reviewDocxMvpSmoke.test.mjs
- docs/construction-plan-p0-docx-trial-roadmap.md
- 本 OpenSpec

## 验证

pnpm typecheck
pnpm smoke:product-boundaries
pnpm smoke:review
pnpm smoke:review:docx

## 不做

- 开工条件 MaxKB 联调
- 审查报告 DOCX 导出
- 全面 UI 重构
