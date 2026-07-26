## Context

当前开工条件页面已经具备：

- workspace 级任务台账；
- 选中任务 detail handoff；
- 报告归档与历史轮次；
- rectification rerun 入口；
- `src/openingConditionRunSnapshot.ts` 共享快照内核。

但 `productWorkspacePages.tsx` 仍有旧的本地派生函数，继续自己计算：

- `summarizePreviousRun()`
- `buildRectificationClosureDiff()`

这与共享内核形成双轨，属于典型“现在还能跑，后面一定漂”的风险。

## Goal

- 让 run comparison / closure / rerun-entry 的核心事实只在共享内核里维护一份。
- 页面组件只消费共享内核导出的数据，不再维护第二套规则。
- 用最小变更完成，不重做页面结构，不改后端 contract。

## Non-Goals

- 不重构整个 `productWorkspacePages.tsx`。
- 不新增 run snapshot 后端接口。
- 不改 rectification closure 的业务判定规则。

## Decisions

### 1. 保留 `openingConditionRunSnapshot.ts` 作为唯一 closure 语义来源

决定：

- 继续以 `src/openingConditionRunSnapshot.ts` 为共享内核；
- 页面若需要 closure summary 或 previous-run summary，统一调用共享模块。

原因：

- 该模块已经承载 `deriveOpeningConditionRunSnapshot()`、`buildRectificationClosureDiff()` 和 `summarizePreviousRun()`；
- 再让页面保留一套本地函数，只会扩大未来漂移面。

### 2. 页面只保留展示映射，不保留领域派生

决定：

- `productWorkspacePages.tsx` 可以保留 UI tone/label 映射；
- 但 previous-run summary、closure diff、是否可发起 rerun 等领域事实一律不在页面本地重新计算。

原因：

- 展示映射属于视图逻辑；
- closure / rerun / selected-run semantics 属于共享事实逻辑。

### 3. 用源码级 UI smoke 锁住“不再重复实现”

决定：

- 在 `server/openingConditionPilotUiBoundarySmoke.test.mjs` 增加断言；
- 确认 `productWorkspacePages.tsx` 继续导入共享 snapshot 内核，同时不再声明本地 `buildRectificationClosureDiff` / `summarizePreviousRun`。

原因：

- 这类问题不是 build 才能发现的运行时 bug，而是“逻辑又被复制回来”的结构回归；
- 用轻量源码 smoke 最适合当前仓库节奏。

## Risks / Trade-offs

- [风险] 页面里可能还有零散 helper 间接依赖旧函数。
  - Mitigation：先定点替换调用，再跑 focused smoke。

- [风险] 中文源码在终端里有编码噪声，窄 patch 容易失败。
  - Mitigation：继续使用英文结构上下文或 Node/PowerShell 定点定位后再 patch。
