## Context

当前 supporting evidence 已经能：

- 显示 provider readiness
- 区分 provider 不可用、降级、超时、空结果
- 提供 retry

但在真实投产链路里，单次 query 拼接仍然过于粗糙。对文档类审查来说，同一条 issue 往往存在多种可检索表达：

- 规范依据表达
- 问题标题表达
- 原文锚点表达

如果只尝试一种混合 query，就会把“可以命中但表达不对”误判成“完全没证据”。

## Goals / Non-Goals

**Goals**

- 提升真实 provider 下的最小命中概率
- 保持查询链路安全、可解释、可截断
- 不新增复杂前端交互成本

**Non-Goals**

- 不做 reranker
- 不做 embedding / vector pipeline
- 不做 query 编辑器
- 不做批量 issue 预取

## Decisions

1. 后端维护固定顺序 query candidates
   - `basis-led`
   - `anchor-led`
   - `title-led`
   - 理由：这三个策略最贴近当前 issue 结构，且易于解释

2. 采用“命中即止”的 bounded probing
   - 最多尝试 3 次
   - 理由：避免 provider 压力和工作台延迟失控

3. 返回 attempts 摘要而不是原始 provider 请求列表
   - 每次 attempt 只保留：
     - strategy
     - querySummary
     - hitCount
   - 理由：联调足够用，同时不泄露 raw payload

## Response Additions

- `strategy`
- `attempts`

`attempts[]`:

- `strategy`
- `querySummary`
- `hitCount`

## UI Behavior

- 工作台显示：
  - 当前命中策略
  - 已尝试次数
- 如果仍为空结果，用户可看到已经尝试过的 query 摘要
- 不新增额外人工编辑输入
