## Context

`revised-plan-snapshot` 已经是平台正式结果资产的一种：

- 后端 `reviewTaskDecisionService.mjs` 可生成
- 前端结果页可展示
- 但导出能力仍只覆盖 `supervisor-report`

这意味着审改模式缺少最终 handoff 产物，不利于对外试跑和真实交付。

## Goals / Non-Goals

**Goals**

- 用最小改动补齐 `revised-plan-snapshot` 导出闭环
- 复用现有 HTML -> DOCX adapter，而不是再开第二套导出链路
- 保持现有 `supervisor-report` 导出行为不变

**Non-Goals**

- 不改 `revised-plan-snapshot` 的业务字段模型
- 不做 PDF 导出
- 不做复杂模板化排版

## Decisions

1. 复用现有导出接口
   - 继续使用 `POST /api/review-tasks/:taskId/report/export-docx`
   - 理由：对前端和调用方最稳定，不新增心智负担

2. 后端按 `resultAsset.type` 分派 HTML builder
   - `supervisor-report` -> 审核报告 HTML
   - `revised-plan-snapshot` -> 整改快照 HTML
   - 理由：统一导出入口，降低重复逻辑

3. 前端结果页根据资产类型切换按钮文案与 HTML fallback
   - 理由：让用户知道导出的到底是“审核报告”还是“整改后方案快照”

## Risks / Trade-offs

- [Risk] `processedParagraphs` 很长，HTML 导出体积变大
  - Mitigation: 做有界截断和简洁排版，只保留快照必要内容

- [Risk] 把两种资产塞进同一路由可能让错误语义混杂
  - Mitigation: 对无资产和不支持资产类型分别给出清晰状态
