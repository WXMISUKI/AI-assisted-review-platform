## Why

施工方案审查当前已经具备：

- 文档上传与结构恢复
- issue 生成与工作台决策
- 后端持久化与结果产出
- basis 结构化归一

但还缺少一个对投产更有价值的最小闭环：当用户看到一条 issue 时，无法进一步查看“这条问题背后的支持证据召回结果”。这会导致：

- 工作台里的依据展示仍然主要停留在 issue 自带 basis
- 知识库 provider 已经接入，却没有进入施工方案审查主链路
- 下一阶段如果继续只磨 viewer 或提示词，收益会低于“让 issue 有可追溯支持证据”

当前最合适的 MVP 方向，不是做完整知识库平台，也不是继续堆字符串解析规则，而是补上：

`issue -> supporting retrieval evidence -> workbench display`

## What Changes

- 为施工方案审查新增 issue 级 supporting evidence 查询接口
- 后端根据 task + issue 组织安全检索 query，调用现有 knowledge-base provider
- 前端新增 typed API 与 issue 卡片证据展示区
- provider 不可用时安全降级，不阻塞工作台使用

## Capabilities

### Modified Capabilities

- `review-workbench`: issue 卡片可以查看 supporting retrieval evidence
- `external-provider-integration-contracts`: retrieval hits 进入施工方案审查工作台，但仍然只作为 supporting recall
- `backend-connectivity`: 新增 issue supporting evidence typed client contract

## Impact

- Backend:
  - `server/index.mjs`
  - new helper for issue evidence retrieval query assembly
- Frontend:
  - `src/domain/backendConnectivity.ts`
  - `src/domain/reviewTypes.ts`
  - `src/ReviewWorkbenchPage.tsx`
- Verification:
  - small backend endpoint test
