## Why

真实试点闭环已经可以跑到正式核查、人工复核和报告生成前后，但当前页面仍可能把已归档任务当成活跃任务继续触发“执行正式核查”等动作，导致出现 `Cannot run checklist matching while task is archived.` 这类阻断性报错。

这不是局部 UI 问题，而是试点可重复运行能力的交付缺口：同一工作区下，运营人员需要明确知道“当前运行任务是谁”，归档任务只能查看，不能再被误操作。

## What Changes

- 补充“当前运行任务”解析与切换规则：
  - 页面刷新时优先解析当前工作区最新的非归档试点任务
  - 若没有可运行任务，再回退到工作区基础任务或最近归档任务用于只读展示
- 补充归档态动作兜底：
  - 归档任务禁用正式核查、报告生成和人工复核后续操作
  - 页面明确提示“请重新上传并初始化新 run”
- 补充前端动作失败恢复：
  - 当页面持有过期 taskId 或误命中归档任务时，刷新后自动重新对齐当前工作区运行任务

## Capabilities

### New Capabilities
- `opening-condition-current-run-action-guard`: 定义当前运行任务解析、归档任务只读化以及动作恢复规则。

### Modified Capabilities
- `opening-condition-pilot-execution-console`: 增加当前运行任务优先级、归档态操作禁用和引导文案。
- `opening-condition-pilot-operational-api`: 明确前端可利用任务列表能力解析当前工作区运行任务，归档态非法动作保持安全失败。

## Impact

- `src/App.tsx`：收敛当前运行任务解析与刷新逻辑。
- `src/productWorkspacePages.tsx`：执行台与报告页增加归档态动作禁用和提示。
- `src/domain/backendConnectivity.ts`：补齐任务列表读取能力，支持前端解析当前运行任务。
- 不改变后端状态机本身，不改变正式核查算法，不引入新外部依赖。
