## Context

当前后端已经返回当前任务的 `basisVersion`、`requiredMasterData`、`knowledgeBaseRef`，同时治理页也能读取工作区目录和预览字段。现有问题不是缺少数据，而是当前 run 资产与工作区目录混在同一层，操作员需要自行推断绑定关系和正式可用性。

本变更服务于开工条件 MVP 的真实试点交付，优先保证状态语义、责任边界和可追溯性。实现必须保留现有页面结构和主题系统，使用已有状态元数据和安全摘要函数，不把 provider 原始输出暴露到页面。

## Goals / Non-Goals

**Goals:**

- 在治理页顶部提供独立的当前 run 绑定快照。
- 分别展示依据、主数据、知识库三类绑定资产。
- 对每项显示生命周期状态、是否正式可用、来源/预览摘要、缺失字段和下一动作。
- 无绑定 run 时显示明确的未绑定状态，而不是伪造工作区目录为当前 run。
- 用源码级 smoke 固化关键边界，避免后续 UI 重构回退。

**Non-Goals:**

- 不新增数据库表、持久化字段或 API。
- 不改变正式匹配门禁算法。
- 不接入新的 OCR、MaxKB 或 LLM provider。
- 不进行全局工作台视觉重构、权限模型或多租户改造。

## Decisions

1. **复用现有后端任务绑定字段。** 当前 run 以 `pilotTask.basisVersion?.id`、`pilotTask.requiredMasterData[].id` 和 `pilotTask.knowledgeBaseRef?.id` 为唯一绑定来源；工作区目录仅作为候选/对照，不反向推断绑定。
2. **新增独立快照组件而非重写目录列表。** 快照组件放在治理页门禁摘要之后、工作区目录之前，减少现有列表变更风险，并让“本次 run 消费什么”成为首屏信息。
3. **状态语义由现有元数据函数统一生成。** 依据使用 `getOpeningConditionBasisPublicationStatusMeta`，主数据使用 `getOpeningConditionMasterDataPublicationStatusMeta`；组件仅补充 `usableForFormalMatch` 的展示推断：依据必须 `published`，主数据必须 `human_approved` 或 `published`，知识库必须 `ready` 且 provider 同步就绪。
4. **预览和正式资产显式分层。** 快照中的预览状态、置信度、缺失字段和 provenance 只作为确认依据；只有发布/批准状态才显示“可用于正式核查”，不把 provider preview 映射为 published。
5. **验证采用轻量源码 smoke。** 现有项目已采用 Node test 读取源码并断言关键边界，本变更沿用该方式，不新增一次性测试文件，也不默认执行完整构建。

## Risks / Trade-offs

- [现有类型字段存在可选值] → 组件对缺失绑定记录采用明确的“未找到后端绑定记录”状态，不抛异常。
- [状态标签部分历史文案编码异常] → 新增稳定的英文数据属性/短标签作为 smoke 锚点，显示文案继续遵循现有页面语言和状态元数据。
- [目录与当前 run 数据短暂不同步] → 快照优先读取任务绑定 id，并在找不到目录记录时显示绑定 id 和缺失提示，不把目录首条记录当作当前资产。

## Migration Plan

1. 先实现纯前端快照和 UI smoke。
2. 运行开工条件 store、HTTP、UI、acceptance smoke。
3. 若验证通过，标记 OpenSpec tasks 完成并归档 change。
4. 回滚时仅移除快照组件和对应 smoke 断言，不涉及数据迁移。

## Open Questions

- 当前 MVP 不新增按项目/合同包筛选控件；后续若出现多 workspace 同屏需求，再单独设计筛选和权限边界。
