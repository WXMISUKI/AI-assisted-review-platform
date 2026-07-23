## 1. Spec

- [x] 1.1 完成工作区概览产品化 change 的 proposal、design、delta specs 与任务拆分。

## 2. Overview Productization

- [x] 2.1 重写工作区概览页首屏和指标文案，明确项目、审查对象、参建主体、当前 run、门禁状态和下一动作。
- [x] 2.2 将项目 / 审查对象 / 参建主体三层上下文展示成清晰的企业台账式信息块。
- [x] 2.3 优化项目对象切换区，展示审查对象类型、参建主体数量、合同包、选中态和切换动作。
- [x] 2.4 保持概览页只做入口和摘要，不新增上传、正式核查、报告等重复操作入口。

## 3. Style

- [x] 3.1 补充 scoped overview/object switcher 样式，映射到现有语义 token，避免复制外部品牌视觉。

## 4. Verification And Archive

- [x] 4.1 运行 `cmd /c node node_modules\\typescript\\bin\\tsc --noEmit`。
- [x] 4.2 运行 `openspec validate --changes opening-condition-workspace-overview-productization`。
- [x] 4.3 同步并归档 `opening-condition-workspace-overview-productization`。
