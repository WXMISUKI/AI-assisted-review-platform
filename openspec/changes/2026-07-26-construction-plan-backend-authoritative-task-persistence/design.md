## Context

当前施工方案审查任务状态存在三条并行持久化路径：

```text
前端 session service
  -> saveReviewTasks()
       -> localStorage
       -> POST /api/review-tasks/bulk

前端 reviewer actions
  -> 精确后端接口
       -> resolve / draft / manual issue / complete

前端 hydration
  -> GET /api/review-tasks
```

问题不在于后端能力缺失，而在于前端仓库层还把 bulk 当成所有热路径的默认落盘方式。

## Goals / Non-Goals

**Goals**

- 让任务创建和关键落盘路径优先使用单任务后端 upsert。
- 让 issue 决策、草稿编辑、人工问题、完成审查继续以已有精确后端接口为主。
- 让 localStorage 回归“机会型缓存”，不再承担热路径主持久化职责。
- 避免 backend hydration 在空列表场景下抹掉前端已有任务上下文。

**Non-Goals**

- 不重写施工方案审查状态机。
- 不新增数据库迁移或新的服务端存储模型。
- 不在本次变更补齐删除任务专用后端接口。
- 不改开工条件平台持久化链路。

## Decisions

1. `saveReviewTasks` 改为显式同步模式，而不是默认 bulk。
   - 理由：当前问题的根因就是默认同步语义过重。仓库层必须把“是否落后端、怎么落后端”从默认副作用改成显式选择。

2. 新建任务使用单任务 `PUT /api/review-tasks/:taskId`。
   - 理由：服务端已具备该能力，最小改造即可避免上传后靠整批 bulk 才能进入后端真源。

3. 删除任务暂时保留 bulk replace。
   - 理由：当前服务端没有 task-level DELETE。为了不扩大本次范围，先把删除收敛为低频显式 bulk，而不是继续让所有高频更新都经过 bulk。

4. backend hydration 返回空列表时保持当前前端任务。
   - 理由：MVP 期间不能因为后端暂时为空、开发文件被清空、或新建任务尚未来得及同步，就把用户当前可见任务列表抹掉。

## Repository Contract

新增显式保存选项：

```ts
saveReviewTasks(tasks, {
  backendSync: "none" | "upsert-changed" | "bulk-replace",
  changedTaskIds?: string[],
})
```

- `none`: 只更新本地缓存。
- `upsert-changed`: 对指定任务 id 逐个 `PUT` 到后端。
- `bulk-replace`: 显式执行整批替换，仅用于删除或少数兼容场景。

## Session-service Mapping

- `createDocumentTask` -> `upsert-changed`
- `deleteDocumentTask` -> `bulk-replace`
- `updateTask(...)` 默认 -> `none`
- 本地 optimistic reviewer action -> `none`
- 实际 reviewer action 持久化 -> 继续由页面层调用已有精确后端接口并回填返回任务

## Risks / Trade-offs

- [Risk] 某些尚未接入精确后端接口的本地状态更新刷新后可能只保留缓存态。
  - Mitigation: 本次优先保住“创建任务、进入审查、issue 决策、完成审查”这些 MVP 主链路；剩余状态后续按价值补齐。

- [Risk] 删除任务仍依赖 bulk replace。
  - Mitigation: 删除属于低频操作，先把 bulk 从高频热路径移除，后续再补 task DELETE API。

- [Risk] 本地与后端短暂存在最终一致性窗口。
  - Mitigation: 保留乐观 UI，并在已有精确后端动作成功后用返回任务覆盖本地态。
