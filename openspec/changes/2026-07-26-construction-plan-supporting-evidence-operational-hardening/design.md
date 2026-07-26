## Context

当前 supporting evidence 已具备基本闭环，但还存在典型 MVP 第二阶段问题：

```text
用户点开支持证据
  -> 请求失败 / 无命中
  -> 只能看到一句模糊 message
  -> 无法判断：
     - provider 未配置？
     - provider 当前降级？
     - 查询无命中？
     - 是否适合重试？
```

这会直接影响真实试跑效率，因为联调与试用阶段最常见的问题不是“完全没功能”，而是“有功能但不知道为什么不好用”。

## Goals / Non-Goals

**Goals**

- 明确 supporting evidence 的运行态分类
- 让前端能够给出清晰、低风险的 retry 交互
- 让 query 具备 bounded explainability，方便后续联调和优化

**Non-Goals**

- 不做 provider 管理控制台
- 不做 query 人工编辑器
- 不做 reranker、cache persistence 或批量预取
- 不修改正式 issue 结论 ownership

## Decisions

1. supporting evidence 返回 readiness snapshot
   - 包含 `provider`、`configured`、`ready`、`status`、`summary`
   - 理由：前端需要区分“真的没命中”和“provider 本身不可用”

2. supporting evidence 返回 `canRetry`
   - 仅当失败属于暂时性状态时为 `true`
   - 理由：避免用户在 `disabled/unconfigured` 场景无意义连点

3. supporting evidence 返回 `queryParts`
   - 仅保留安全、截断后的结构化检索片段
   - 理由：联调时可解释，但不暴露 raw payload 或过长文本

## Response Additions

- `readiness`
- `canRetry`
- `queryParts`

状态建议：

- `ready`
- `empty`
- `provider_unavailable`
- `provider_degraded`
- `timeout`
- `failed`
- `invalid_query`

## UI Behavior

- 证据面板显示 provider readiness 摘要
- `empty` 显示“未召回支持证据”
- `provider_unavailable` / `provider_degraded` 显示安全降级文案
- `canRetry=true` 时显示“重试查询”按钮
- 不改变 accept / reject / edit 主流程
