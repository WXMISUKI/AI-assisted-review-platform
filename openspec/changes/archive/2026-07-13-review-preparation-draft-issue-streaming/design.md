## Context

当前系统已经具备三层能力：

1. OCR 后能恢复结构化段落与章节。
2. reviewSessionService 能把 recoveredStructure 合并进任务，并生成 deterministic draft issues。
3. loading / preparation 页面能展示 stage.issueSummaries，但这些摘要还没有直接来源于 draft issues。

本次变更只补“加载态问题摘要”这条链路，让结构恢复后的审查准备阶段看起来像真的在做审查，而不是在播放固定模板。

## Decisions

### 1. 以 recoveredStructure 生成的问题草稿作为摘要源

**Decision:** review-preparation 阶段的 issueSummaries 直接从 recoveredStructure 生成的 deterministic draft issues 归纳，而不是继续使用固定 mock 文案。
**Why:** 这样摘要与当前段落、章节和风险模式保持一致，用户能在锁定态看到真实的审查信号。

### 2. 摘要按段落上下文分组

**Decision:** 先按段落聚合草稿问题，再为 stage 选择对应的当前段落摘要。
**Why:** review-preparation stage 本身就是段落级推进，摘要按段落组织更稳定，也更容易和 currentParagraphId / currentSection 对齐。

### 3. 保留模板级回退

**Decision:** 如果 recoveredStructure 没有触发任何草稿规则，继续沿用现有模板 stage.issueSummaries 或通用提示。
**Why:** 保持旧任务、弱结构任务和 mock 数据的可用性，不让 loading 页“空掉”。

## Risks / Trade-offs

- [Risk] 草稿问题数量可能比当前 stage 多，摘要会显得拥挤。
  [Mitigation] 只保留每个阶段最相关的 1-3 条摘要，并按当前段落过滤。
- [Risk] 某些 recoveredStructure 只有少量段落，摘要可能过于集中。
  [Mitigation] 沿用模板 fallback，确保仍有合理的阶段提示。
- [Risk] 摘要逻辑如果和 issue 生成逻辑分叉，后续会不一致。
  [Mitigation] 摘要直接基于 `buildStructureDraftIssues` 的结果，不再重复写规则。
