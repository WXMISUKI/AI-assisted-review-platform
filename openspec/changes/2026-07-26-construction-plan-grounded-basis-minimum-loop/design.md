## Context

当前 issue 模型和工作台已经具备 basis-backed 的数据结构与展示槽位，但实际生成链路并不统一：

```text
rule engine
  -> finding.basis = string
  -> kernel.basisReferences = naive wrapper

llm generator
  -> finding.basis = string
  -> kernel.basisReferences = naive wrapper

draft issue adapter
  -> finding.basis = string
  -> kernel.basisReferences = placeholder title
```

这说明问题不在 UI，而在“依据生成层没有统一结构化入口”。

## Goals / Non-Goals

**Goals**

- 为现有生成链路提供一个共享 basis normalization 入口。
- 尽量从 basis 字符串中识别规范名、版本号、条款号和来源类型。
- 保持现有 issue contract 和工作台动作不变。

**Non-Goals**

- 不接入真正的知识库检索。
- 不做 RAG recall、vector store、reranker、document chunk 管理。
- 不对所有历史 mock 数据做全面重写。
- 不追求 100% 法条解析准确率。

## Decisions

1. 先做“basis string -> structured references”归一层，而不是直接做知识库查询。
   - 理由：这是离当前代码最近、最快能提升真实可审性的最小 vertical slice。

2. 将 rule / LLM / draft issue 三条路径统一接入同一 helper。
   - 理由：如果只修一条路径，工作台里的依据体验仍会不一致。

3. 无法精确解析时返回安全 fallback reference。
   - 理由：MVP 需要稳定性和一致性，不能因为一个 basis 解析失败就回退成完全无结构状态。

## Normalization Strategy

输入：

- 原始 `basis` 文本
- 可选 `reason`
- 可选 fallback title / type / priority

输出：

- 至少一个 `BasisReference`
- 若识别到：
  - `《...》` 书名号标题
  - `JGJ120` / `JGJ46-2005` / `JT/T 1495-2024` / `JTG F90-2015` 等版本号
  - `第37号` / `4.3` / `4.2.1` / `第X条`
  则写入结构化字段
- 若未识别到，则保留原文本作为 `sourceTitle` 或 `summary` 的安全 fallback

## Risks / Trade-offs

- [Risk] 某些自由文本 basis 只能得到部分结构化结果。
  - Mitigation: 明确允许 partial grounding；比完全自由文本更稳定。

- [Risk] 规则或 LLM 文案存在非标准写法，解析结果未必完美。
  - Mitigation: 先保证统一结构和可读展示，后续再引入真正知识库 grounding。
