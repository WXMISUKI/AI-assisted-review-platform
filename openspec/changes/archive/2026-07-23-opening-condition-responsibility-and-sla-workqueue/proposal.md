## Why

当前平台已经有了 run 级的责任归属摘要，但它仍然更像“分散在各页的状态说明”，还不是一个能真正驱动操作员工作的责任与催办工作台。对于真实试点投产来说，最关键的不是再增加一个局部功能，而是让使用者一眼知道三件事：现在卡在哪、该谁处理、下一步该去哪个页面。

在成熟资料审核平台里，责任人、下一动作、时效状态和超期提醒本身就是一级产品能力。对我们当前项目来说，这一步比继续做更重的对象建模更能快速提升可操作性，因为它直接决定日常审核是否“能管起来”。

## What Changes

- 将当前 run 的责任归属从单页摘要升级为可复用的“责任与时效工作队列”视图模型。
- 在工作台概览页新增催办看板，集中展示当前责任人、下一动作、推荐页面、阻塞数量和时效状态。
- 在人工复核页强化优先级表达，区分待处理、延期和已闭环项，并明确何时责任已转交到报告交付。
- 保持 archived run 只读，不为历史轮次引入新的变更入口。

## Capabilities

### New Capabilities
- `opening-condition-responsibility-workqueue`: 定义面向操作员的责任、时效、推荐页面和阻塞概览工作台能力。

### Modified Capabilities
- `opening-condition-action-ownership`: 责任归属不再只是一段说明，还需要支持推荐页面与主动作语义。
- `opening-condition-human-review-delivery-hardening`: 人工复核页需要按待处理优先级组织队列，并明确责任何时转交报告交付。
- `opening-condition-pilot-execution-console`: 工作区概览需要消费统一责任派生结果，而不是只显示 run 状态和入口按钮。

## Impact

- `src/openingConditionPortalState.ts`：扩展责任归属派生模型，新增推荐页面与主动作字段。
- `src/productWorkspacePages.tsx`：在工作台概览新增催办看板，在人工复核页强化优先级和责任移交展示。
- `src/styles/opening-condition.css`：补充责任看板、优先级列表和紧凑 SLA 卡片样式。
- `openspec/specs/*`：同步责任与时效工作台语义。
