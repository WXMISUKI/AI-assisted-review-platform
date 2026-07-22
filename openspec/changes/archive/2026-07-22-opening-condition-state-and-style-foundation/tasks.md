## 1. Spec

- [x] 1.1 补充“状态单一来源 + 样式分层治理”proposal、design 与 delta specs。

## 2. State Foundation

- [x] 2.1 新增开工条件工作台共享前端派生状态模块。
- [x] 2.2 让资料接入页、执行台和上传面板改为消费共享状态模型，而不是散落布尔判断。

## 3. Style Foundation

- [x] 3.1 从 `src/styles.css` 中拆出主题 token 文件。
- [x] 3.2 从 `src/styles.css` 中拆出开工条件工作台样式文件，并保持统一入口导入。

## 4. Verification

- [x] 4.1 运行 `cmd /c node node_modules\\typescript\\bin\\tsc --noEmit`。
- [x] 4.2 运行 `openspec validate --changes opening-condition-state-and-style-foundation`。
