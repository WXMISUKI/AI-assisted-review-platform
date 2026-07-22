## 1. Spec Completion

- [x] 1.1 完成 intake publication governance 的 proposal、design、specs 与任务拆分。

## 2. Domain Helpers

- [x] 2.1 在 `src/domain/openingConditionReview.ts` 中补充依据与主数据发布治理所需的状态标签、说明和分组 helper。
- [x] 2.2 让页面可以统一消费 basis/master-data 的 operator-facing 状态文案，而不是直接显示底层枚举。

## 3. Publication Governance UI

- [x] 3.1 在 `src/productWorkspacePages.tsx` 中将“依据与主数据”页重构为发布治理面，包含门禁摘要、当前 run 绑定快照、待处理队列、已发布目录和异常记录。
- [x] 3.2 在当前 run 快照中明确展示项目、审查对象、参建主体、依据版本、主数据事实和知识库状态。
- [x] 3.3 将 basis/master-data 原始列表改为按治理分区展示，并补充空状态说明。

## 4. Styling

- [x] 4.1 在 `src/styles/opening-condition.css` 中补充发布治理面样式，保持企业级工作台风格和现有主题系统一致。

## 5. Verification

- [x] 5.1 运行 `cmd /c node node_modules\\typescript\\bin\\tsc --noEmit`。
- [x] 5.2 运行 `openspec validate --changes opening-condition-intake-publication-governance`。
