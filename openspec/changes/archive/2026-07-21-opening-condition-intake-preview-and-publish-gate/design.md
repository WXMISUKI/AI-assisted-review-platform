## Context

当前开工条件试点的最小闭环已经能从真实文件进入 formal match、human review、report/archive，但资料接入阶段的“事实发布边界”还不清楚。用户实际已经明确感受到两类混淆：

- basis/master data 页里既有 trial 占位记录，也有后端正式记录，但页面没有把“预览态”和“可正式核查态”拆开；
- formal match 的门禁主要靠后端返回阻塞原因，前端没有把 basis 发布、主数据确认、knowledge-base readiness 组织成一个显式的 publish gate。

这个切片不重做后端状态机，而是在现有接口基础上把门禁操作前移到 UI，让真实试点更可解释、更可重复。

## Goals / Non-Goals

**Goals:**
- 让操作员在 formal match 前看清当前 run 绑定的 basis、master data、knowledge base。
- 提供显式的 basis 发布与主数据确认动作，形成可操作的 preview/publish gate。
- 让 formal match 按当前门禁状态前端禁用并给出 next action，而不是等接口报错。
- 降低 trial placeholder、human approved、published 这些状态的歧义。

**Non-Goals:**
- 不在本切片中重写 basis/master-data 的完整抽取与审核状态机。
- 不新增新的上传链路或新的后端 API。
- 不生成正式 docx 报告，也不扩展多项目/多租户模型。

## Decisions

### 1. 复用现有 basis/master-data API，而不是新增 intake draft API

原因：当前后端已经提供 `publishOpeningConditionPilotBasis` 与 `decideOpeningConditionPilotMasterData`，而且用户此刻最需要的是把“可操作的门禁”落到真实试点链路里。先复用现有 API，可以最快把价值交付出来。

备选：
- 新增独立 intake draft/publish API：语义更纯，但改动面更大，不适合当前试点推进节奏。
- 继续只靠后端 readiness 报错：实现最省，但用户理解成本最高。

### 2. Basis 与 master data 分开操作，但在同一预览门禁里展示

原因：basis 的关键动作是发布，master data 的关键动作是人工确认。两者语义不同，不宜混成一个黑盒按钮；但从操作员视角，它们共同组成“可以开始正式核查了吗”的 gate，所以要放在同一视图里讲清楚。

### 3. Formal match 在前端按 readiness gate 禁用

原因：后端仍然保留真实门禁，前端只做更友好的预防和解释。这样不会削弱安全性，同时能减少“点了才报错”的挫败感。

## Risks / Trade-offs

- [已有后端状态迁移可能不完全一致] → 通过保守按钮文案与刷新后端事实来降低误判，不在前端假设复杂状态迁移。
- [页面中存在历史乱码片段] → 本次仅在相关模块做局部替换，避免大面积重写 `productWorkspacePages.tsx`。
- [主数据“确认”和“发布”语义仍未完全统一] → 本切片明确把 `human_approved` 视为可用于 formal match 的门禁通过态，并在文案中说明。

## Migration Plan

1. 新增 OpenSpec 规格，明确 intake preview / publish gate 行为。
2. 在 `App.tsx` 中接入 basis 发布、主数据确认与刷新逻辑。
3. 在资料接入页与依据/主数据页展示 gate 状态和 next action。
4. 以 `tsc --noEmit` 与 `openspec validate` 做轻量校验。

## Open Questions

- 后续是否需要把“接入预览复核”和“正式核查复核”拆成两个独立人工节点。
- basis/master-data 是否要在后端演进为更显式的 `draft -> preview_confirmed -> published` 生命周期。
