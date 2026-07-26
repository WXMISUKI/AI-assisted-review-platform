## Context

当前开工条件工作区总览已经具备“资产注册表”的产品意图，但事实来源仍分散：

- basis / master-data / knowledge-base readiness 主要来自前端 domain mock packet；
- latest run / archived history 来自页面拿到 task list 后本地再算；
- selected workspace 的“当前绑定解释”没有形成 backend-owned bounded contract。

这会让 overview 成为另一个业务事实计算层，与 pilot task/readiness/report 这些已经后端化的 contract 不一致。

## Goal

- 让 workspace asset registry summary 由后端派生并通过 API 暴露。
- 让 overview 页以 typed contract 渲染 basis/master-data/kb/run-history/current-run binding 摘要。
- 保持改动最小，不重做导航、不拆大组件、不改施工审查。

## Non-Goals

- 不把全部 workspace/mock domain 数据都迁到后端。
- 不新增完整项目/工作区数据库模型。
- 不重做整页布局，也不顺手改 basis/master-data/knowledge-base 其他治理页。

## Decisions

### 1. 后端拥有 workspace asset summary，而不是页面本地继续派生

决定：

- 在 `server/openingConditionPilotStore.mjs` 中新增 workspace asset registry summary derive/list 能力；
- 返回每个 workspace 的 bounded operational summary。

原因：

- task、basis、master-data、knowledge-base 的正式状态已经主要由后端 store/API 管理；
- overview 应该消费同一套 owner 事实，避免前端再维护第二套 readiness 规则。

### 2. 允许后端在薄切片内继续复用现有 workspace seed，而不是这轮引入新持久化

决定：

- 当前实现继续复用已有 opening-condition workspace seed；
- 但 registry summary 的派生在后端完成，前端不再直接把本地 mock domain 结果视为最终 operational contract。

原因：

- 这轮目标是“ownership 收口”，不是“全量基础数据持久化改造”；
- 先把 API contract 站稳，后续再替换底层来源成本更低。

### 3. current-run binding explanation 进入 contract，而不是由文案散落在页面

决定：

- summary 中加入 `currentRunBinding` 字段；
- 表达当前工作区 formal run 绑定了什么 basis/master-data/knowledge-base，以及是否仍停留在 provisional / blocked。

原因：

- 这正是用户最关心、也最容易跨页漂移的事实；
- 把它变成 contract 后，overview、report、未来工作台都能复用。

### 4. focused smoke 同时覆盖 HTTP 和 UI 边界

决定：

- 新增一个后端 smoke 验证 registry summary contract；
- 更新现有 UI smoke，确保 overview 继续展示 Asset Registry，但前端改为通过 typed backend contract 渲染。

原因：

- 这类改动的核心风险是“看起来页面正常，但 contract 漏字段或又回退成本地派生”；
- focused smoke 可以用最小成本拦住这类回归。

## Risks / Trade-offs

- [风险] 现有后端 store 里 knowledge-base / basis / master-data 记录可能不完整，部分 workspace 只能回落到 seed 事实。
  - Mitigation：本轮 contract 明确返回 bounded summary 和 binding explanation，不伪装成“全部正式已发布”。

- [风险] overview 仍需要保留 catalog 结构展示，完全移除前端 domain helper 范围过大。
  - Mitigation：这轮只收口 asset summary fact；catalog/tree 结构先保留。

- [风险] UI smoke 目前锁定了本地 helper 名称，需要同步更新断言。
  - Mitigation：改成锁定新的 client function / prop / asset registry rendering 关键字。
