## 1. Specification

- [x] 1.1 补齐 `opening-condition-run-snapshot-kernel-adoption` 的 proposal、design、delta spec，并通过 OpenSpec 层面自检。

## 2. Implementation

- [x] 2.1 让 `productWorkspacePages.tsx` 中任务台账/closure summary 统一改用 `openingConditionRunSnapshot.ts` 的共享派生函数。
- [x] 2.2 删除页面本地重复的 previous-run / closure diff 领域派生逻辑，只保留展示映射与视图 helper。
- [x] 2.3 补 focused UI smoke，覆盖“页面继续消费 shared run snapshot、且不再保留本地重复 closure diff 实现”。

## 3. Verification and Archive

- [x] 3.1 运行开工条件 focused smoke。
- [x] 3.2 记录 `openspec validate --changes opening-condition-run-snapshot-kernel-adoption --json` 中该 change 自身为 `valid: true`。
- [x] 3.3 任务完成后归档该 change。
