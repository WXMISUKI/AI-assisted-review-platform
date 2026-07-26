## Why

截至 2026-07-26，施工方案审查的 supporting evidence 已经完成两步：

- `2026-07-26-construction-plan-supporting-retrieval-evidence-loop`
  - 跑通 `issue -> supporting evidence -> workbench display`
- `2026-07-26-construction-plan-supporting-evidence-operational-hardening`
  - 补齐 readiness、失败分级、retry 与 query explainability

下一阶段如果还想继续沿最小 MVP 主线推进，最有价值、最接近快速投产的问题已经不是“有没有入口”，而是“真实命中率够不够用”。

当前 supporting evidence 的 query 还是一次性拼接：

- 标题
- basis
- anchor
- section
- paragraph text

这种做法虽然安全、简单，但在真实 provider 场景下容易出现两个问题：

1. query 过长、信号过杂，反而降低召回质量
2. 一次检索无命中时，没有更温和的回退策略

所以这轮最值得做的，是把 query 从“单次拼接”升级成“多策略、按序试探、命中即止”的安全校准版。

## What Changes

- 后端 supporting evidence query 改为多策略候选
- 依次尝试：
  - basis-led
  - anchor-led
  - title-led
- 命中后返回实际采用策略与尝试摘要
- 前端工作台显示策略与尝试次数，但不增加复杂操作

## Capabilities

### Modified Capabilities

- `review-workbench`: supporting evidence 从“能解释失败”升级为“更容易命中且可解释采用了哪种检索策略”
- `backend-connectivity`: supporting evidence 响应新增 strategy / attempts 字段

## Impact

- Backend:
  - `server/reviewIssueSupportingEvidence.mjs`
- Frontend:
  - `src/domain/backendConnectivity.ts`
  - `src/ReviewWorkbenchPage.tsx`
- Verification:
  - `server/reviewIssueSupportingEvidence.test.mjs`
