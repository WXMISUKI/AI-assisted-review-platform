## Why

当前单项目真实试点已经跑通“上传 -> 正式核查 -> 人工复核 -> 报告归档”的最小链路，但结果仍停留在单次 run 的摘要层。真实投产更关键的问题已经变成：如何把一次核查产出的不符合项变成可读报告、如何在整改后发起下一轮复审、以及如何把多轮历史保留成可追溯台账。

## What Changes

- 将报告页从“汇总摘要”升级为“按核查项输出不符合项、风险等级、依据、整改要求、复核结论”的内部辅助交付页。
- 在同一工作区内引入“多轮评审 / 整改复审”视图，让归档 run 成为历史记录，新上传资料触发新的复审 run，而不是覆盖旧 run。
- 为每一轮 run 增加历史列表、轮次标识、发起时间、结果状态、报告资产与处理摘要。
- 增加受控的历史处置策略：默认归档保留，允许管理员软删除测试或误建 run，但不默认物理删除正式历史。
- 为复审链路补充“上一轮问题在本轮是否已补齐/仍未通过”的对比摘要，帮助监理快速判断整改效果。

## Capabilities

### New Capabilities
- `opening-condition-rectification-rerun-history`: 定义同一工作区下多轮核查、整改复审、历史留存与软删除策略。
- `opening-condition-report-findings-delivery`: 定义面向监理的核查报告内容结构，包括不符合项、依据、风险等级与整改建议。

### Modified Capabilities
- `opening-condition-repeatable-trial-run-versioning`: 从“可重复新建 run”扩展为“同一工作区多轮复审有序留痕”。
- `opening-condition-pilot-execution-console`: 增加 run 历史入口、当前轮次上下文与复审发起动作。
- `opening-condition-real-sample-trial-package`: 报告资产不再只展示摘要，还应承载 findings delivery 所需的结构化上下文。
- `opening-condition-pilot-operational-api`: 需要支持历史 run 列表、软删除/隐藏与报告 findings 字段。

## Impact

- `src/App.tsx`：维护当前 run 与历史 run 的切换、复审发起、软删除动作。
- `src/productWorkspacePages.tsx`：报告归档页升级为 findings delivery；新增 run 历史与复审入口。
- `src/domain/backendConnectivity.ts`：补充历史列表、软删除与报告详情的前端合同。
- 后端任务持久化与报告资产结构需要补充多轮 run 关联字段，但先保持单工作区试点范围，不扩展多租户权限。
