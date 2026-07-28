## Why

在 A+B 打通逐文件资产化和动态 checklist 之后，开工条件平台已经拿到了真实输入，但操作员仍然不能在同一个任务工作台里顺畅完成“查看资料 -> 审核待核查项 -> 完成人工复核 -> 查看最终报告”闭环。现在最影响投产的不是再补输入，而是把人工复核节点和最终报告输出真正收束成平台内置的单任务工作流。

## What Changes

- 将开工条件任务详情收束为单一工作台：列表态、文件预览态、待核查项复核态、最终报告态在同一个选中任务上下文里切换。
- 将人工复核完成动作收束成平台显式闭环：所有阻塞项处理完后，操作员在任务工作台内完成“完成人工复核并生成报告”。
- 将右侧进度面板调整为智能体时间线，并在流程完成后以内联 Markdown 作为最终报告主视图，而不是优先展示密集诊断表。
- 保持历史任务创建、删除、重新发起新审核时的选中任务和返回逻辑一致，避免用户在任务详情和新建审核之间来回迷路。

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `opening-condition-pilot-execution-console`: 调整选中任务工作台的人审闭环、预览/复核模式切换、历史任务交互和主操作路径。
- `opening-condition-report-delivery-workbench`: 调整最终报告输出为 Markdown 优先的交付视图，并将密集诊断降级为辅助信息。

## Impact

- 前端主影响文件：`src/productWorkspacePages.tsx`
- 可能涉及前端契约使用：`src/domain/backendConnectivity.ts`
- 可能涉及后端现有任务事实复用：`server/openingConditionPilotStore.mjs`
- 主要依赖既有平台任务、humanReviewQueue、events、reportAsset.markdownContent，不新增外部依赖
