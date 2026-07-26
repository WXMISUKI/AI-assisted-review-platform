## 1. 规格

- [x] 1.1 为施工方案审查任务持久化收口建立独立变更，明确本次只做“后端主导、前端机会型缓存”最小 MVP 纵切。
- [x] 1.2 明确创建、删除、reviewer action、hydration 的持久化责任边界。

## 2. 实现

- [x] 2.1 为 `reviewTaskRepository` 增加显式后端同步模式，移除 `saveReviewTasks` 默认全量 bulk 同步。
- [x] 2.2 为前端后端客户端补齐单任务 upsert 调用，创建任务优先落后端单任务快照。
- [x] 2.3 保持 reviewer action 继续走已有精确后端接口，本地 optimistic 更新不再额外触发 bulk。
- [x] 2.4 调整 hydration 空列表策略，避免无意义清空当前可见任务列表。

## 3. 验证

- [x] 3.1 运行 `pnpm typecheck`。
- [x] 3.2 至少运行一组已有 smoke，确认施工方案主链路未被破坏。

## 4. 归档

- [x] 4.1 回写本变更任务状态与实现边界。
- [x] 4.2 在路线图中补充“下一步应补 task DELETE API / 更细粒度后端持久化”的收口说明。
