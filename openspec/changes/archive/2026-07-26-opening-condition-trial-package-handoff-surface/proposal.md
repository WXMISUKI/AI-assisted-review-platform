# Why

开工条件平台已经具备 `trialPackage`、`deliveryHandoff`、`mvpAcceptance`、`blockingReasons` 等真实试点交付事实，但这些事实目前主要分散在报告页、归档页或底层 task payload 中。

对于最小 MVP 投产来说，下一阶段最值钱的不是继续打磨局部视觉，也不是继续深挖 provider，而是让操作者在**任务台账选中态**就能一眼看清：

- 这一轮资料试点当前处于什么交付状态；
- 卡在 provider/readiness/human review/report/archive 的哪一层；
- 下一步该去哪个入口推进；
- 历史 run 与当前 run 是否只读。

这能把“能跑通试点”进一步推进到“可重复验收、可交付、可回溯”。

# What Changes

- 为开工条件任务台账选中态增加 `trialPackage` 交付快照展示。
- 将 `trialPackage` 与 `deliveryHandoff` 的关键事实压缩成操作者可读的 handoff 面板。
- 补 focused UI smoke，锁住这条 handoff surface。

# Capabilities

## Modified Capabilities

- `opening-condition-real-sample-trial-package`
- `opening-condition-report-handoff`
- `opening-condition-pilot-execution-console`

# Impact

- Frontend:
  - `src/productWorkspacePages.tsx`
- Verification:
  - `server/openingConditionPilotUiBoundarySmoke.test.mjs`
