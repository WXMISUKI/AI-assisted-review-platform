# 代码归属与整理基线

更新时间：2026-07-24

## 目录归属

| 目录 | 归属 | 允许内容 |
|---|---|---|
| `src/shared` | 平台共用 | 两个产品语义一致的契约、展示元数据、纯工具 |
| `src/domain` | 领域共用入口 | 跨产品的类型边界和服务契约；产品特有对象应继续分域 |
| `src/styles/theme-tokens.css` | 平台共用 | 颜色、间距、文字和状态 token |
| `src/styles/shared-foundation.css` | 平台共用 | 壳层和通用组件样式 |
| `src/styles/construction-plan.css` | 施工方案审查 | 施工方案页面样式 |
| `src/styles/opening-condition.css` | 开工条件核查 | 开工条件页面样式 |
| `src/App.tsx` | 平台编排 | 登录、产品切换和跨产品协调；不承载新的业务规则 |
| `src/ConstructionPlanReviewApp.tsx` | 施工方案审查 | 施工方案页面编排和局部视图状态 |
| `src/productWorkspacePages.tsx` | 开工条件核查 | 开工条件页面编排；后续按页面垂直拆分 |
| `server/openingConditionPilotStore.mjs` | 开工条件核查 | 当前试点状态机和文件型持久化；后续按契约增量拆分 |
| `server/review*` | 施工方案审查 | review task/run/worker/issue/result 服务 |

## 状态归属

- 页面局部状态：tab、dialog、selected row、loading。
- 施工方案持久状态：`ReviewTask`、review generation run、issue、result asset。
- 开工条件持久状态：workspace、basis、master data、pilot task/run、check item、human review、report asset。
- provider 状态：只通过 readiness/diagnostics summary 进入业务层，不直接成为业务结论。

## 整理顺序

1. 先抽取类型、状态展示映射和纯函数。
2. 再拆分页面的 API 调用和视图区块。
3. 最后拆分后端存储模块，并保留原有导出函数。
4. 每一步都执行 `pnpm typecheck` 和对应产品 smoke。

