## Why

当前开工条件试点已经能跑通“资料接入 -> 正式核查 -> 人工复核 -> 报告归档”，但报告页还没有真正承担交付工作台职责。操作员虽然能看到结果，却还不能足够清楚地回答三件最关键的问题：当前看的到底是哪一轮、和上一轮相比差了什么、下一轮应该从哪里唯一发起。

## What Changes

- 将报告归档页收口为“报告交付工作台”，突出当前查看轮次、结论、阻塞项和下一动作。
- 强化历史轮次详情视图，让操作员切换轮次后能直接看到该轮完整报告摘要、整改闭环对照和人工决策留痕。
- 将“不符合与待整改项”从扁平列表改为按处理优先级分组的交付视图，提升试点交付可读性。
- 保持“发起下一轮整改复审”为唯一主入口，只在当前 archived run 的正确上下文中暴露，不对历史轮次误给操作入口。

## Capabilities

### New Capabilities
- `opening-condition-report-delivery-workbench`: 定义报告交付页作为单项目试点交付工作台的展示结构、轮次切换和主操作入口。

### Modified Capabilities
- `opening-condition-report-findings-delivery`: 报告中的问题项展示从统计附属信息升级为按交付优先级组织的可扫描工作台内容。
- `opening-condition-rectification-rerun-history`: 历史轮次不只支持查看列表，还要支持更明确的轮次切换与详情上下文。
- `opening-condition-pilot-execution-console`: 报告页继续作为下一轮整改复审的唯一主入口，并与其他页面保持一致的只读边界。

## Impact

- `src/productWorkspacePages.tsx`：调整报告归档页的结构、分组逻辑、历史轮次切换与主操作展示。
- `src/styles/opening-condition.css`：补充报告工作台、轮次摘要、优先级分组和历史详情的局部样式。
- `openspec/specs/*`：同步报告交付工作台、历史轮次详情和整改复审主入口的行为语义。
