## 1. Spec

- [x] 1.1 补充“责任人与下一动作驱动 + archived 只读护栏”proposal、design 与 delta specs。

## 2. Readonly Guardrails

- [x] 2.1 收口 archived 轮次在试点执行台中的所有变更按钮禁用状态。
- [x] 2.2 收口 archived 轮次在 Trial Intake Overview 中的发布与确认按钮禁用状态。

## 3. Action Ownership

- [x] 3.1 为 opening-condition pilot run 实现前端派生的当前责任人、下一动作、时限状态与原因说明。
- [x] 3.2 在资料接入页执行台与人工复核页展示统一的动作归属卡片。

## 4. Delivery Surfaces

- [x] 4.1 在报告归档页展示本轮责任人、下一动作、时限状态与整改移交摘要。
- [x] 4.2 在历史轮次详情中展示只读动作归属快照，帮助区分当前轮与历史轮责任边界。

## 5. Verification

- [x] 5.1 运行 `cmd /c node node_modules\\typescript\\bin\\tsc --noEmit`。
- [x] 5.2 运行 `openspec validate --changes opening-condition-action-ownership-and-readonly-guardrails`。
