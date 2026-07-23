## 1. Spec

- [x] 1.1 完成报告交付工作台 change 的 proposal、design、delta specs 与任务拆分。

## 2. Report Workbench

- [x] 2.1 在报告页顶部新增“当前选中轮次”交付摘要区，明确当前/历史、轮次、结论和关键计数。
- [x] 2.2 将“不符合与待整改项”改为按交付优先级分组展示，而不是单一扁平列表。

## 3. History And Rerun Entry

- [x] 3.1 强化历史轮次列表的选中态和详情联动，让切换轮次后详情区同步更新。
- [x] 3.2 保持“发起下一轮整改复审”只在当前 archived run 的上下文中作为唯一主入口出现。

## 4. Verification

- [x] 4.1 运行 `cmd /c node node_modules\\typescript\\bin\\tsc --noEmit`。
- [x] 4.2 运行 `openspec validate --changes opening-condition-report-delivery-workbench`。
