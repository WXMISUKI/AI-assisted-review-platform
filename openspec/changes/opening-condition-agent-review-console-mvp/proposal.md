# Change: opening-condition-agent-review-console-mvp

## Why

真实样本试跑发现，开工条件核查平台的默认入口把任务台账、轮次对比、证据、资产治理和后续闭环状态一起铺开，用户在开始审核前就被内部状态淹没。施工审查平台和云工案类成熟产品的共同优点是：首屏只服务一个主任务，让用户先新建审核、上传资料、看进度和拿报告。

当前最有投产价值的 MVP 方向是把开工条件默认体验改成“开工条件核查智能体”的低噪音审核台，而不是继续优化已有台账细节。

## What

- 沉淀开工条件智能体审核台交互指导文档。
- 将默认工作区从指标/台账型概览改为智能体新建审核入口。
- 保留当前项目切换、历史任务、任务进度和已有后端任务事实。
- 将三类资料上传重构为弹窗式任务创建入口：合同/资质依据、资料核查表、核查资料包。
- 在任务详情区域提供文件列表/预览占位和智能体进度/报告入口。
- 明确资料完整性必选，资料合规性可选；合规结论只能来自工作流/后端规范化结果，前端不得硬编码伪造。

## Non-Goals

- 不实现新的 Dify 子智能体编排引擎。
- 不新增数据库字段或后端存储契约。
- 不实现完整 PDF/DOCX 真实预览器，MVP 先展示平台对象摘要和存储引用。
- 不删除已有台账、人工复核、报告归档和资产治理能力，只调整默认呈现层级。

## Impact

- Primary frontend file: `src/productWorkspacePages.tsx`
- Styling: `src/styles/opening-condition.css`
- UI smoke: `server/openingConditionPilotUiBoundarySmoke.test.mjs`
- Guidance: `docs/opening-condition-agent-review-console-guidance.md`

## Guardrails

- Backend task facts remain source of truth.
- Dify workflow is a reference/adapter, not durable UI fact owner.
- Completeness-only reports must not imply deep compliance review.
- Compliance review UI can be selected, but deep findings must come from existing workflow/backend outputs.
