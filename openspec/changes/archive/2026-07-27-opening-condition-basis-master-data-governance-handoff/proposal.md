## Why

当前开工条件平台已经具备依据/主数据预览、人工确认、发布和 run 门禁，但操作员仍需要在候选队列、工作区目录和概览之间拼接判断，难以快速回答“本次 run 实际绑定了什么、哪些只是 preview、哪些已经可以用于正式核查”。这会直接影响投产验收和审查责任追溯，因此下一步应优先补齐当前 run 的治理交付视图，而不是继续做局部 UI 美化或 provider 深度调参。

## What Changes

- 在依据/主数据治理页增加独立的“当前 run 绑定快照”区域，与工作区资产目录明确分离。
- 对当前 run 显示依据版本、主数据事实、知识库状态，以及每项的生命周期、预览状态、置信度、来源摘要、缺失字段和下一动作。
- 明确区分 `preview`、`human_approved`、`published` 和异常状态，禁止把 preview 误显示为正式可复用资产。
- 当依据未发布、主数据未确认或知识库未就绪时，在当前 run 快照中显示阻断原因和下一动作。
- 增加轻量 UI smoke，锁定“当前 run 绑定可见”和“preview 不等于 published”的边界。

## Capabilities

### New Capabilities

无。本变更复用现有治理能力，不引入新的业务能力边界。

### Modified Capabilities

- `opening-condition-publication-governance`: 补强当前 run 绑定快照的独立展示和预览/发布语义。
- `opening-condition-master-data`: 补强当前 run 主数据事实的生命周期、证据和未决原因展示。

## Impact

- 主要影响 `src/productWorkspacePages.tsx` 的依据/主数据治理页及其展示辅助逻辑。
- 新增或扩展 `server/openingConditionPilotUiBoundarySmoke.test.mjs` 的源码级 UI 边界断言。
- 不改变后端数据结构、HTTP API、provider 合同、主题 token 或依赖。
