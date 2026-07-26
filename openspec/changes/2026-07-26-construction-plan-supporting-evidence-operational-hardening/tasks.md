## 1. 规格

- [x] 1.1 建立 supporting evidence operational hardening 变更
- [x] 1.2 明确本轮只做运行态可见性、失败分级和 retry 语义

## 2. 实现

- [x] 2.1 后端 supporting evidence 响应补充 readiness / canRetry / queryParts
- [x] 2.2 后端补充失败状态分级逻辑
- [x] 2.3 前端工作台增加 provider 状态和 retry 按钮

## 3. 验证

- [x] 3.1 `pnpm typecheck`
- [x] 3.2 `node --test server/reviewIssueSupportingEvidence.test.mjs`
- [x] 3.3 `pnpm smoke:review`

## 4. 归档

- [x] 4.1 回写本轮任务状态
- [x] 4.2 明确下一步优先进入真实 provider 联调与 query 质量校准
