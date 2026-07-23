## 1. Spec

- [x] 1.1 完成责任人与时效交付收口 change 的 proposal、design、delta specs 与任务拆分。

## 2. Ownership And Workqueue

- [x] 2.1 规范 `deriveOpeningConditionRunActionOwnership` 的中文阶段、责任人、下一动作、原因、时效和主按钮文案。
- [x] 2.2 优化 `OpeningConditionActionOwnershipSummary` 与 `OpeningConditionResponsibilityBoard` 的信息层级，明确责任人、阻塞、时效和推荐入口。

## 3. Human Review Handoff

- [x] 3.1 将人工复核页的 pending/deferred/resolved 分组文案改成操作者可理解的交付语义。
- [x] 3.2 强化人工复核项的展示字段和动作边界，只对 open/deferred 项提供决策按钮。

## 4. Verification And Archive

- [x] 4.1 运行 `cmd /c node node_modules\\typescript\\bin\\tsc --noEmit`。
- [x] 4.2 运行 `openspec validate --changes opening-condition-responsibility-handoff-clarity`。
- [x] 4.3 同步并归档 `opening-condition-responsibility-handoff-clarity`。
