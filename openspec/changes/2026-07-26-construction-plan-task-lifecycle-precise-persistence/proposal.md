## Why

我们刚完成了“施工方案审查任务持久化后端主导化”的第一刀，已经把高频热路径上的默认 bulk 同步移掉了。但从 MVP 真实试跑角度看，仍然有两个明显缺口：

- 删除任务仍依赖显式 `bulk replace`，不是 task-scoped 精确后端动作。
- 上传完成、OCR 关键状态、准备包生成、问题生成完成等关键生命周期 checkpoint 仍可能只停留在前端缓存态，刷新恢复时不够稳定。

这意味着平台已经从“每次都 bulk”进步到了“多数路径不 bulk”，但还没有完全到“关键任务状态都能稳定落回后端真源”。

## What Changes

- 为施工方案审查补齐 task-scoped `DELETE /api/review-tasks/:taskId`。
- 前端删除任务不再通过剩余任务集合做 `bulk replace`。
- 将关键生命周期 checkpoint 收口为单任务 `PUT /api/review-tasks/:taskId`：
  - 上传结果回填
  - OCR 终态或带结构回填
  - 审查准备包落盘
  - draft issues 合并完成
  - generation run ready/degraded/failed 终态
  - ready 入口收口
- 保持流式阶段推进、阅读视角、滚动上下文等高频 UI 状态仍为本地机会型缓存，不做每步后端写入。

## Capabilities

### Modified Capabilities

- `document-review-task`: document review task supports task-scoped deletion and precise lifecycle checkpoint persistence.
- `review-session-state`: critical lifecycle checkpoints prefer backend task upsert while high-frequency UI-only progress remains cache-only.

## Impact

- Backend task store: `server/reviewTaskStore.mjs`
- Backend routes: `server/index.mjs`
- Frontend backend client: `src/domain/backendConnectivity.ts`
- Frontend repository: `src/domain/reviewTaskRepository.ts`
- Frontend session service: `src/domain/reviewSessionService.ts`
- Validation: `server/reviewMvpSmoke.test.mjs`
