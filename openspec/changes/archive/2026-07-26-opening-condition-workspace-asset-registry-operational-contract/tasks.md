## 1. Specification

- [x] 1.1 补齐 `opening-condition-workspace-asset-registry-operational-contract` 的 proposal、design、delta spec，并通过 OpenSpec 自检。

## 2. Implementation

- [x] 2.1 在后端 store/API 增加 workspace asset registry summary contract，覆盖 basis、master-data、knowledge-base、run history、current-run binding explanation。
- [x] 2.2 在 `src/domain/backendConnectivity.ts` 增加 typed client，并让 `src/App.tsx` 加载该 contract。
- [x] 2.3 在 `src/productWorkspacePages.tsx` 的 overview 中优先消费 backend-owned registry summary，保留页面结构但不再把前端本地 registry 派生当作唯一事实来源。

## 3. Verification and Archive

- [x] 3.1 新增并运行 focused workspace asset registry smoke，同时回归 opening-condition UI/HTTP smoke。
- [x] 3.2 记录 `openspec validate --changes opening-condition-workspace-asset-registry-operational-contract --json` 中该 change 自身为 `valid: true`。
- [x] 3.3 任务完成后准备归档该 change。
