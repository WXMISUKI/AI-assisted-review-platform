## Why

当前开工条件工作台已经具备真实试点闭环，但 UI 状态判断仍散落在 `App.tsx`、`productWorkspacePages.tsx` 等大文件里，样式也集中在超过 4000 行的 `styles.css` 中。继续沿着这种方式迭代，会让状态收口、只读边界、主题一致性和页面改版越来越难控，因此需要先把“状态单一来源 + 样式分层治理”打成当前业务线的基础样板。

## What Changes

- 为开工条件工作台引入共享的前端派生状态模型，统一 archived/current/rerun 等 UI 变更边界和可变更动作判断。
- 将主题 token 与开工条件工作台样式从 `src/styles.css` 中拆分为分层文件，保留统一入口但降低单文件复杂度。
- 让执行台、资料接入页和相关页面通过共享状态模型消费只读/可变更规则，而不是在组件内散落布尔判断。
- 将样式治理收束为 token 层、壳层/通用层、业务工作台层三段，后续新增页面沿此结构扩展。

## Capabilities

### New Capabilities
- `opening-condition-portal-view-model`: 定义开工条件工作台的共享前端派生状态、只读边界和 rerun 意图语义。
- `platform-style-governance`: 定义样式 token、入口文件和业务样式拆分的分层治理规则。

### Modified Capabilities
- `opening-condition-pilot-execution-console`: 执行台与资料接入页需基于共享状态模型统一控制只读与可变更动作。

## Impact

- `src/App.tsx`
- `src/productWorkspacePages.tsx`
- `src/styles.css`
- `src/styles/*.css`
- 新增工作台状态派生模块与样式分层文件
