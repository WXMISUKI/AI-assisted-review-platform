## 1. Spec

- [x] 1.1 为“整改复审与历史台账交付包”补充 proposal、design 与 specs。

## 2. Report Delivery

- [x] 2.1 将报告页从统计摘要升级为 findings-oriented 交付视图。
- [x] 2.2 为 failed / blocked / warning 项补充问题描述、依据、风险等级、整改建议和人工复核结论。
- [x] 2.3 为报告页补充“下一步整改提交建议”摘要。
- [x] 2.4 将报告页中的内部状态枚举转换为监理可读的中文语义标签，并强化阻塞/不通过/待判断的层级区分。

## 3. Rerun History

- [x] 3.1 在同一 workspace 展示 run 历史列表，区分当前 run 与 archived 历史。
- [x] 3.2 支持归档后发起新一轮复审 run，并保持历史 run 只读。
- [x] 3.3 增加受控软删除/隐藏策略，仅用于误建或测试 run 清理。
- [x] 3.4 在历史轮次列表中支持进入某一轮详情，查看该轮完整报告与处理摘要。

## 4. Comparison and Handoff

- [x] 4.1 补充“上一轮未通过项在本轮是否已整改”的对比摘要。
- [x] 4.2 在报告与历史列表中展示轮次、处理时间和最终结论，便于监理快速回顾。

## 5. Verification

- [x] 5.1 运行 `cmd /c node node_modules\\typescript\\bin\\tsc --noEmit`。
- [x] 5.2 运行 `openspec validate --changes opening-condition-rectification-rerun-and-report-delivery`。
