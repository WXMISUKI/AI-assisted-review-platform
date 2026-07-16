## Why

开工条件核查已经具备单项目试点任务、依据版本、项目主数据、人工复核和报告归档的基础闭环，但当前资料匹配仍偏“文件名/摘要命中”，不足以支撑真实试点中对人员、设备和签章勾选类资料的可信判定。

本次变更把已确认的业务决策固化为平台规则：合同负责确认参与机构与合同工作范围，人员和设备通过该合同主体下已发布或人工批准的项目主数据确认；签名、盖章、勾选等视觉要素只能作为可复核断言，不直接等同真实有效。

## What Changes

- 记录开工条件核查的领域语言和架构决策，明确平台内可控工作流为主，外部编排仅作为可选适配器。
- 扩展开工条件试点核查项状态，将资料存在、项目/主体相关性、内容符合性、视觉断言和最终处置分层表达。
- 让人员、设备类核查项必须绑定已发布或人工批准的项目主数据；合同和补充依据提供主体与范围边界，不要求合同正文逐一列名。
- 将签名、盖章、勾选、日期不清晰等低置信视觉要素落入人工复核队列，并保存安全证据摘要。
- 更新前端演示数据与展示文案，让用户能看见“合同边界 + 主数据 + 证据化人审”的真实试点方向。

## Capabilities

### New Capabilities

- `opening-condition-evidence-grounded-material-review`: 证据化开工条件资料核查能力，覆盖资料范围、资源授权、分层判定、视觉断言和人工复核门禁。

### Modified Capabilities

- `opening-condition-pilot-workflow`: 将试点工作流要求从通用资料匹配增强为合同边界、主数据授权和证据化人工复核驱动的资料核查闭环。

## Impact

- Affected docs: `CONTEXT.md`, `docs/platform-architecture.md`, `docs/product-requirements.md`, `docs/opening-condition-pilot-workflow.md`, `docs/adr/*`.
- Affected OpenSpec: new change delta specs under `openspec/changes/opening-condition-evidence-grounded-material-review/specs/`.
- Affected backend: `server/openingConditionPilotStore.mjs` and focused node tests.
- Affected frontend/domain demo: `src/domain/openingConditionPilot.ts`, `src/domain/openingConditionReview.ts`, and opening-condition portal display surfaces.
- No new external dependencies are expected.
