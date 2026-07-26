## Context

当前持久化分层已经变成：

```text
创建任务
  -> 单任务 upsert

reviewer action / 完成审查
  -> 精确后端 action API

其余多数本地任务变更
  -> localStorage cache only
```

这是正确方向，但还缺一层“关键生命周期 checkpoint”：

- 文档从 uploaded/parsing 进入可恢复状态
- OCR 结构被真正回填
- 准备包与草稿问题已经生成
- generation run 已进入可编辑终态
- task 删除能稳定反映到后端

## Goals / Non-Goals

**Goals**

- 删除任务改为 task-scoped 后端精确删除。
- 关键 checkpoint 改为单任务 upsert，不再靠 bulk 兼容。
- 保持当前页面与工作台交互行为不变。

**Non-Goals**

- 不把每个 stream stage 都写后端。
- 不把 `reviewViewContext`、滚动位置等 UI 焦点态后端化。
- 不重写 review generation bridge 或工作台。

## Decisions

1. 删除任务补 `DELETE /api/review-tasks/:taskId`。
   - 理由：这是一条真实业务动作，不应再依赖“把剩余任务整批替换上去”。

2. 只持久化 checkpoint，不持久化每次流式阶段变化。
   - 理由：真正影响刷新恢复与可继续试跑的是阶段结果，而不是每一次 loading 进度跳动。

3. 继续允许本地 optimistic UI。
   - 理由：MVP 仍要保证交互顺滑；后端精确 checkpoint 是为了恢复与真源一致性，不是把所有状态改成阻塞式 async。

## Checkpoint Mapping

- `updateDocumentTaskUploadResult` -> upsert changed
- `syncDocumentTaskOcrStatus`
  - `submitted` / `done` / `failed` or with `recoveredStructure` -> upsert changed
  - `pending` / `running` progress only -> local cache
- `updateReviewTaskPreparationPackage` -> upsert changed
- `mergeGeneratedReviewIssues` -> upsert changed
- `completeReviewGenerationRun` / `failReviewGenerationRun` -> upsert changed
- `markReviewTaskReady` -> upsert changed
- `deleteDocumentTask` -> delete changed

## Risks / Trade-offs

- [Risk] 某些尚未纳入 checkpoint 的中间状态刷新后仍可能只恢复到最近一个稳定点。
  - Mitigation: 这是有意选择。MVP 先保住“能恢复、能继续试跑”的业务状态，而不是追求每一步动画进度完全可重放。

- [Risk] 本地 fallback 路径与后端 generation materialization 可能写入相近任务快照。
  - Mitigation: 使用同一 task-scoped upsert 合同，后端以最后一个合法快照为准，不引入新的批量覆盖副作用。
