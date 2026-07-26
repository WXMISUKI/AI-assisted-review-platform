## 1. 规格

- [x] 1.1 建立 supporting evidence query calibration 变更
- [x] 1.2 明确本轮只做多策略查询与尝试摘要，不做 reranker 或人工 query 编辑

## 2. 实现

- [x] 2.1 后端 supporting evidence 增加多策略 query candidates
- [x] 2.2 后端返回 strategy / attempts 摘要
- [x] 2.3 前端工作台显示命中策略与尝试次数

## 3. 验证

- [x] 3.1 `pnpm typecheck`
- [x] 3.2 `node --test server/reviewIssueSupportingEvidence.test.mjs`
- [x] 3.3 `pnpm smoke:review`

## 4. 归档

- [x] 4.1 回写任务状态
- [x] 4.2 明确下一步再进入真实 provider 联调，而不是继续堆本地规则
