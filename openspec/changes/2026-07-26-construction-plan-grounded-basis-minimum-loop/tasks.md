## 1. 规格

- [x] 1.1 建立“施工方案审查依据 grounding 最小闭环”变更，明确本次只做 basis normalization，不做完整知识库接入。
- [x] 1.2 明确 rule / LLM / draft issue 三条链路统一接入共享 basis helper。

## 2. 实现

- [x] 2.1 新增共享 basis normalization helper，支持最小结构化解析与安全 fallback。
- [x] 2.2 接入 `reviewRuleEngine.mjs`，提升规则 issue 的 basisReferences 质量。
- [x] 2.3 接入 `reviewLlmGenerator.mjs` 与 `reviewDraftIssueAdapter.mjs`，统一 LLM / fallback issue 的 basisReferences。
- [x] 2.4 保持工作台决策流与 issue contract 不变。

## 3. 验证

- [x] 3.1 运行 `pnpm typecheck`。
- [x] 3.2 运行 `pnpm smoke:review`。

## 4. 归档

- [x] 4.1 回写任务状态与边界。
- [x] 4.2 在路线图中补充“下阶段 grounding 若继续推进，应引入知识库召回而不是继续堆字符串规则”的说明。
