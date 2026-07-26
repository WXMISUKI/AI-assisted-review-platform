## Why

上一轮已经完成了施工方案审查的最小 supporting retrieval evidence 闭环：

- 单条 issue 可以按需触发 supporting evidence 查询
- 后端通过平台 task/issue 上下文组织 query
- 工作台可以展示 safe retrieval hits

但从真实投产角度看，这一层目前还停留在“能查”而不是“可运营”：

- 当 provider 不可用时，用户只能看到泛化失败提示，不知道是未配置、降级、超时还是可重试失败
- 查询命中失败时，前端缺少清晰的 retry 闭环
- 当前 query 只以整句拼接为主，虽然安全，但不够解释型，也不方便后续优化和联调

如果下一步继续去打磨 viewer 或提示词，会再次陷入局部优化；而把 supporting evidence 做到“状态明确、失败可重试、query 可解释”，更接近真实试跑和快速投产。

## What Changes

- 为 supporting evidence 接口补充 provider readiness 摘要、失败分级与 retry 语义
- 后端返回结构化 query parts 与 bounded query summary
- 前端 issue 证据面板显示 provider 状态、失败原因、重试按钮

## Capabilities

### Modified Capabilities

- `review-workbench`: supporting evidence 从“可查看”升级为“可判断是否可用、可重试”
- `external-provider-integration-contracts`: supporting recall 继续受平台边界约束，但具备更清晰的运行态反馈
- `backend-connectivity`: supporting evidence 响应契约新增 readiness / retry / query summary 字段

## Impact

- Backend:
  - `server/reviewIssueSupportingEvidence.mjs`
  - `server/index.mjs`
- Frontend:
  - `src/domain/backendConnectivity.ts`
  - `src/domain/reviewTypes.ts`
  - `src/ReviewWorkbenchPage.tsx`
- Verification:
  - supporting evidence 轻量后端测试扩展
