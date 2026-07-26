## Why

施工方案审查当前虽然已经具备后端任务存储与精确 reviewer action 接口，但前端热路径仍保留了“每次本地任务变更后立即全量 `POST /api/review-tasks/bulk`”的旧做法。

这导致三个实际问题：

- 上传、解析、流式准备等高频状态更新会反复触发整批任务快照同步，放大超时与浏览器存储压力。
- 很多 reviewer action 已经通过精确后端接口持久化，但本地热路径仍然额外做一次 bulk，同一动作存在重复写入。
- 页面刷新后是否能恢复到一致任务状态，取决于 bulk 是否恰好成功，而不是由后端单任务快照与精确接口主导。

对 MVP 来说，下一阶段最有价值的不是继续微调预览或提示词，而是先把任务持久化路径收口，避免“能跑但不稳”。

## What Changes

- 将施工方案审查任务持久化调整为“后端主导、前端机会型缓存”。
- `saveReviewTasks` 不再默认对所有本地任务变更执行全量 bulk 同步。
- 新建任务优先走单任务 `PUT /api/review-tasks/:taskId` upsert。
- 删除任务仍保留显式 bulk replace 作为当前最小兼容方案。
- 已有 reviewer action 继续以精确后端接口为主，本地只保留乐观更新与缓存兜底。
- 后端 hydration 在返回空列表时不主动抹掉当前已加载的本地任务列表。

## Capabilities

### Modified Capabilities

- `review-session-state`: review task aggregate persistence is backend-authoritative for creation and targeted reviewer actions, while localStorage becomes opportunistic cache only.
- `review-workbench`: backend hydration no longer clears locally available task context just because the backend currently returns an empty list.

## Impact

- Frontend repository: `src/domain/reviewTaskRepository.ts`
- Frontend session service: `src/domain/reviewSessionService.ts`
- Frontend backend client: `src/domain/backendConnectivity.ts`
- Construction-plan task shell: `src/ConstructionPlanReviewApp.tsx` behavior remains compatible
- Docs / OpenSpec: roadmap and persistence change artifacts
