# Why

开工条件平台已经从“单页演示”进入“单项目试点闭环 + 多轮整改复审 + 历史只读”的阶段。此时最容易破坏投产稳定性的，不再是某个局部按钮样式，而是 **操作者无法稳定确认当前工作区到底绑定了什么正式资产**。

当前 `src/productWorkspacePages.tsx` 的 overview 虽然已经展示 `Current workspace assets`，但它主要依赖 `src/domain/openingConditionReview.ts` 中的前端本地派生：

- 从 mock packet 推导 basis / master-data / knowledge-base readiness；
- 从 task 列表推导 latest run / archived history；
- 在页面层自行组合“当前工作区资产摘要”。

这在单工作区演示时还能工作，但一旦进入多对象、多主体、多轮次试跑，用户最先质疑的会是：

- 我当前看的到底是哪套依据、哪套主数据、哪个知识库；
- 当前 run 是不是绑定了已发布资产；
- 同项目下相邻工作区的历史轮次有没有被混用。

按 MVP 和最快投产的思路，下一阶段最值钱的不是继续磨页面，而是把 **工作区资产注册摘要收口为平台 own 的后端 contract**，让前端展示的是 backend-owned operational fact，而不是继续在 overview 层拼凑。

# What Changes

- 新增 opening-condition workspace asset registry summary 的后端 operational contract。
- 提供 workspace 级资产摘要 API，返回 basis、master-data、knowledge-base、run history、current-run binding explanation 等 bounded safe fields。
- 前端增加 typed client 并让 overview 优先消费 backend-owned registry summary，而不是直接调用前端本地 `buildOpeningConditionWorkspaceAssetRegistry(...)` 作为唯一事实来源。
- 补 focused smoke，锁住“同项目不同 workspace 隔离”“latest run / archived count 语义”“overview 继续展示 Asset Registry 但改用新 contract”。

# Capabilities

## Modified Capabilities

- `opening-condition-workspace-asset-registry`
- `opening-condition-pilot-operational-api`

# Impact

- 受影响代码：
  - `server/openingConditionPilotStore.mjs`
  - `server/index.mjs`
  - `src/domain/backendConnectivity.ts`
  - `src/App.tsx`
  - `src/productWorkspacePages.tsx`
  - `server/openingConditionPilotUiBoundarySmoke.test.mjs`
- 不改施工审查平台。
- 不新增数据库，不改现有试点状态机，不顺手重构整个 overview 页面。
