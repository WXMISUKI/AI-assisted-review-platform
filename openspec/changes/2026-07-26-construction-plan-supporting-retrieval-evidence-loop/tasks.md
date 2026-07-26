## 1. 规格

- [x] 1.1 建立 supporting retrieval evidence MVP 变更，明确只做 issue 级按需查询与展示
- [x] 1.2 明确 provider hits 仍然只作为 supporting recall，不进入正式结论 ownership

## 2. 实现

- [x] 2.1 新增后端 issue supporting evidence query helper
- [x] 2.2 新增 `GET /api/review-tasks/:taskId/issues/:issueId/supporting-evidence`
- [x] 2.3 新增前端 typed API 与 supporting evidence result types
- [x] 2.4 在 `ReviewWorkbenchPage` 中增加按需加载与展示闭环

## 3. 验证

- [x] 3.1 运行 `pnpm typecheck`
- [x] 3.2 运行 supporting evidence 相关轻量后端测试
- [x] 3.3 运行 `pnpm smoke:review`

## 4. 归档

- [x] 4.1 回写本轮完成情况与未做项
- [x] 4.2 明确下一步应优先关注 query 质量与真实 provider 联调，而非继续局部 UI 微调
