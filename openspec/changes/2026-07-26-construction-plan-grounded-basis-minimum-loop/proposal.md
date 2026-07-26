## Why

施工方案审查现在已经有可运行的 issue 生成、工作台决策、结果产出和稳定持久化链路，但“依据 grounding”仍然停留在一个很不稳定的状态：

- 规则、LLM、draft issue fallback 会把 `basis` 当作自由文本直接塞进 issue。
- `kernel.basisReferences` 虽然存在，但很多真实生成路径只是把整段 basis 原文塞进 `sourceTitle`，没有稳定的标准名、版本、条款或来源类型。
- 工作台已经具备依据展示位，但当前信息质量不稳定，用户仍容易感到“像提示词拼接结果，而不是可审依据”。

对 MVP 来说，下一阶段最有价值的不是完整知识库平台，而是先把“依据结构化”做成一层共享归一化能力，让现有 issue 生成链路立刻更可信。

## What Changes

- 为施工方案审查新增共享的 basis normalization helper。
- 将 rule engine、LLM issue generator、draft issue adapter 统一接入这层 helper。
- 尽量把 basis 文本解析成：
  - `sourceTitle`
  - `version`
  - `clauseNumber`
  - `type`
  - `summary`
  - `priority`
- 对无法精确识别的 basis，仍生成安全的结构化 fallback，而不是退回成完全自由文本。

## Capabilities

### Modified Capabilities

- `review-issue-model`: generated issues now carry more stable structured basis references instead of mostly raw free-text basis strings.
- `review-workbench`: existing issue-card basis areas become immediately more useful because upstream basis references are normalized.

## Impact

- Shared server helper: new basis normalization module
- Rule findings to issues: `server/reviewRuleEngine.mjs`
- LLM issue normalization: `server/reviewLlmGenerator.mjs`
- Draft issue generation fallback / LLM candidates: `server/reviewDraftIssueAdapter.mjs`
- Optional smoke/unit coverage for normalized basis output
