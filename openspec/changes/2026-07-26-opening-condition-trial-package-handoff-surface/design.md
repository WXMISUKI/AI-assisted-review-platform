## Context

当前任务台账已经能展示：

- run 轮次；
- owner / nextAction；
- issue closure summary；
- acceptance snapshot；
- report status。

但真实试点中最容易引发沟通成本的，是操作者必须在多个页面之间来回切换，才能拼出一轮 run 的交付状态：

- `trialPackage` 在任务对象上；
- `deliveryHandoff` 在报告资产 package diagnostics 上；
- `blockingReasons` 与 provider readiness 分别散在 readiness / trial package；
- 历史只读语义又依赖当前选中 run。

## Goal

- 在任务台账选中态直接展示一份 bounded 的交付快照。
- 用已有后端事实，不新增接口、不复制领域判断。
- 让操作者在进入详情前就能判断“当前能不能交付、卡在哪、下一步去哪”。

## Non-Goals

- 不重做整个任务台账布局。
- 不新增 provider 调试细节或原始日志展示。
- 不改变 report/workspace/archive 的状态机。

## Decisions

### 1. 直接消费已有 `trialPackage` 与 `deliveryHandoff`

决定：

- 任务台账选中态新增一个 trial handoff 面板；
- 只读取已有 `trialPackage` 与 `deliveryHandoff` 的 bounded 字段。

原因：

- 这些事实已经是 backend-owned；
- 页面只负责消费和展示，不应该再派生另一套交付语义。

### 2. 面板聚焦“交付状态、阻塞、下一步、输入摘要”

决定：

- 最小展示四组信息：
  - 当前交付状态与是否只读；
  - blocking reasons / provider readiness；
  - 下一步动作与推荐入口；
  - 输入文件与匹配摘要。

原因：

- 这四组信息最贴近真实试点操作；
- 再展示更多字段会重新滑向“局部信息堆叠”。

### 3. 用 UI smoke 锁住 handoff surface

决定：

- 在 focused UI smoke 中断言：
  - 任务台账选中态继续展示 `trialPackage` handoff；
  - 继续保留 `deliveryHandoff`；
  - handoff 面板直接消费 bounded facts。

原因：

- 这类能力最容易在后续页面重排时被悄悄删掉；
- 源码级 smoke 足够轻量，适合当前仓库节奏。
