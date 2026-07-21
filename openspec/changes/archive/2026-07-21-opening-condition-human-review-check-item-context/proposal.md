## Why

正式核查已经能够生成后端人工复核项，但复核项只显示 `targetId`，没有核查项名称、父级分类、规则说明和证据上下文。监理人员无法判断当前缺失或不确定内容属于哪一类开工条件，也无法基于可追溯证据做出通过、修正、延期或驳回决定。

这会直接阻断真实试点闭环。需要先修复复核数据契约和页面呈现，再继续推进更大范围的项目/知识库建模。

## What Changes

- 为人工复核项补充任务快照级的核查项上下文：
  - 父级分类和子分类
  - 核查项名称
  - 核查项编号
  - 规则说明和期望证据提示
  - 当前证据引用
- 人工复核页面按“分类 -> 核查项名称 -> 编号 -> 状态 -> 原因 -> 证据”展示复核对象。
- 报告人工复核台账保留同一份上下文，保证归档后仍能理解历史决策。
- 对旧任务兼容：当历史队列没有快照字段时，从任务 `checkItems`/`checklistDefinition` 有界回填；无法回填时仍展示编号和原始原因。
- 增加后端归一化和前端类型/渲染验证。

## Capabilities

### New Capabilities
- `opening-condition-human-review-check-item-context`: 定义人工复核项的业务上下文、证据关联和归档可读性。

### Modified Capabilities
- `opening-condition-pilot-execution-console`: 修改人工复核页面和报告台账的展示要求，使复核对象具备可判断的分类与名称上下文。
- `opening-condition-pilot-operational-api`: 修改人工复核和报告台账响应中的有界字段契约。

## Impact

- `server/openingConditionPilotStore.mjs`：生成、归一化和台账投影。
- `src/domain/openingConditionPilot.ts`：扩展人工复核和台账类型。
- `src/productWorkspacePages.tsx`：渲染人工复核上下文。
- `server/openingConditionPilotStore.test.mjs`：覆盖新队列字段、旧数据回填和报告台账。
- 不新增外部依赖，不改变任务状态机，不改变正式匹配算法。
