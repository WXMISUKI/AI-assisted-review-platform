## Why

目前 recoveredStructure 已经能稳定进入 review-preparation 流，`reviewSessionService` 也会把结构化草稿问题合并进任务与工作台。但 loading / preparation 阶段仍然主要展示模板化的 mock issue 摘要，用户在“结构已恢复、审查正准备”的这段时间里，看到的仍然不是来自真实 recovered structure 的问题信号。

这会让恢复结构、问题生成和工作台开放之间出现轻微断层。我们需要把 deterministic draft issues 真正回灌到 loading / preparation 阶段，让用户在锁定态就能看到与当前段落对应的结构化问题摘要。

## What Changes

- 让 review-preparation 阶段优先使用 recoveredStructure 生成的 deterministic draft issues 来形成 issue 摘要。
- 保持没有匹配到草稿规则时的安全回退，不破坏现有 mock 流和手工问题列表。
- 让 loading 页面在结构恢复期间显示更贴近真实审查的摘要，而不是仅依赖固定模板文案。
- 保持 stage、paragraph 和 issue contract 不变，只增强摘要来源。

## Non-goals

- 不接入真实 LLM 问题生成。
- 不改动问题卡片 UI 结构或结果页格式。
- 不引入新的后端依赖或持久化字段。

## Impact

- `src/domain/reviewIssueDrafts.ts`: 增加草稿问题摘要的归纳逻辑。
- `src/domain/reviewPreparationStages.ts`: 将阶段 issueSummaries 改为由 recoveredStructure 驱动。
- `src/appShellPages.tsx`: 让 loading 页面自然消费结构化草稿摘要。
- `openspec/specs/review-session-state/spec.md`: 补充 loading 前置摘要的契约。
- `openspec/specs/streaming-review-workbench/spec.md`: 补充结构化草稿问题在锁定态中的可见性。
