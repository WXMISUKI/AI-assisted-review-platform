# Why

开工条件平台已经进入“多轮次整改复审 + 历史只读 + 当前任务台账”并行存在的阶段。当前最危险的问题不再是某个按钮少了一句提示，而是 **同一轮 run 的事实在不同页面由不同函数重复派生**。

现在 `src/openingConditionRunSnapshot.ts` 已经定义了共享 run snapshot 内核，包括：

- 当前轮 / 历史轮选择语义；
- 上一轮归档对比；
- rectification closure diff；
- 是否允许发起下一轮整改复审。

但 `src/productWorkspacePages.tsx` 里仍保留着一套本地 `summarizePreviousRun()` 和 `buildRectificationClosureDiff()` 逻辑。这意味着任务台账、选中任务 handoff、报告页、历史页未来可能对“已整改 / 延续 / 新增 / 待人工判断”给出不一致结论。

按 MVP 和最快投产的角度，下一阶段最值钱的不是继续堆页面，而是把这类 **多轮 run 共享事实** 先统一，否则真实双轮、三轮试跑时，一线用户最先怀疑的是“为什么同一个问题在两个入口里说法不一样”。

# What Changes

- 让任务台账、选中任务 handoff 和报告/历史视图统一依赖 `openingConditionRunSnapshot.ts` 的共享 closure / previous-run 事实。
- 移除 `src/productWorkspacePages.tsx` 中与 run snapshot 内核重复的 rectification closure 派生逻辑。
- 补 focused UI smoke，确保页面源码层面不再保留本地重复 closure diff 实现，并继续验证共享 snapshot 的关键语义。

# Capabilities

## Modified Capabilities

- `opening-condition-run-snapshot-kernel`
- `opening-condition-pilot-execution-console`

# Impact

- 受影响代码：
  - `src/openingConditionRunSnapshot.ts`
  - `src/productWorkspacePages.tsx`
  - `server/openingConditionPilotUiBoundarySmoke.test.mjs`
- 不新增后端接口、不改状态机、不改施工审查平台。
