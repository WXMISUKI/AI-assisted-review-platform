## 1. Spec

- [x] 1.1 为资料核查页补充“核查项矩阵与匹配状态”展示规格。

## 2. Implementation

- [x] 2.1 在资料核查页将 `checklistDefinition` / `checkItems` / `evidence` / `humanReviewQueue` 组合为矩阵行模型。
- [x] 2.2 为每个核查项展示匹配状态、命中文件、未命中原因、期望资料提示和人工复核状态。
- [x] 2.3 在尚未正式核查时也展示待核查清单，避免页面无法看清所需核查项。
- [x] 2.4 补充矩阵相关样式，保持移动端可读。

## 3. Verification

- [x] 3.1 运行 `cmd /c node node_modules\\typescript\\bin\\tsc --noEmit`。
- [x] 3.2 运行 `openspec validate opening-condition-checklist-matrix-and-match-status`。
