## Why

开工条件平台当前默认新建审核页、资料包逐文件预览、人工复核详情动作三处同时出现回归，直接阻断了 2026 年 7 月 27 日这轮单项目试点的主路径可用性。它们不是局部视觉问题，而是“创建任务 -> 查看资料 -> 完成人工复核”这条 MVP 闭环上的关键断点，必须优先修复。

## What Changes

- 修复开工条件智能体新建审核页在工作区中的整体居中与自适应高度表现，避免默认首页偏到左上角。
- 修复资料包清单文件的预览优先级，优先使用 ZIP 拆分后的逐文件派生资产，无法内联预览时给出清晰的归因和回退入口。
- 修复人工复核详情页的批准、修正、延期、拒绝动作回写，使决策结果立即同步到当前任务视图和历史任务列表。
- 补充轻量 UI smoke，覆盖布局主路径、逐文件预览资产链和人工复核动作回写。

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `opening-condition-pilot-execution-console`: 调整新建审核页布局与任务工作台的数据优先级，保证当前任务详情、资料预览和人工复核操作围绕平台事实一致刷新。
- `opening-condition-packet-item-assets`: 明确逐文件派生资产是资料包清单预览的首选来源，并要求对仅有 manifest 的条目给出可解释回退。
- `opening-condition-human-review-check-item-context`: 要求人工作业详情页基于当前未关闭复核项提供可执行决策，并在决策后立即反映到任务上下文。
- `opening-condition-http-ui-smoke-and-report-handoff`: 增补轻量 smoke，保护上述交互在 UI 边界上不再回归。

## Impact

- Frontend: `src/productWorkspacePages.tsx`, `src/styles/opening-condition.css`, `src/App.tsx`
- Backend/domain contract reuse: `server/openingConditionPilotStore.mjs`, `src/domain/openingConditionPilot.ts`
- Verification: `server/openingConditionPilotUiBoundarySmoke.test.mjs`
