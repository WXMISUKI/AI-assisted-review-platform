## 1. Spec Completion

- [x] 1.1 完成项目对象建模基础层 proposal、design、specs 与任务拆分。

## 2. Domain Model

- [x] 2.1 在 `src/domain/openingConditionReview.ts` 中补充项目、审查对象、参建主体的最小对象模型字段与派生类型。
- [x] 2.2 提供基于 workspace 列表的项目对象 catalog 派生函数，并补充至少一组同项目多对象样本数据。

## 3. App Binding

- [x] 3.1 在 `src/App.tsx` 中让工作区选择、任务上下文与初始化入参显式继承对象模型字段。
- [x] 3.2 保持当前 run / 历史 run / 知识库查询仍按 workspace 隔离，但对外展示使用对象语义。

## 4. Workspace UI

- [x] 4.1 在 `src/productWorkspacePages.tsx` 中将工作区概览升级为项目/审查对象/参建主体分层选择视图。
- [x] 4.2 在关键页面头部或摘要区展示当前项目对象上下文，避免只显示平面工作区信息。
- [x] 4.3 在 `src/styles/opening-condition.css` 中补充对象摘要与对象切换列表样式，保持企业级工作台风格。

## 5. Verification

- [x] 5.1 运行 `cmd /c node node_modules\\typescript\\bin\\tsc --noEmit`。
- [x] 5.2 运行 `openspec validate --changes opening-condition-project-object-model-foundation`。
