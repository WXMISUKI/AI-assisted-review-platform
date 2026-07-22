## 1. Spec Completion

- [x] 1.1 完成 intake preview confirmation 的 proposal、design、specs 与任务拆分。

## 2. Intake Candidate Preview UI

- [x] 2.1 在 `src/productWorkspacePages.tsx` 中为资料接入页增加“识别预览确认工作台”。
- [x] 2.2 将 basis 候选和当前 run 所需 master-data 候选按待确认、待发布、已可用于当前 run 的语义组织展示。
- [x] 2.3 在预览工作台中补充确认动作说明，使“发布依据 / 确认主数据”与正式入库语义对齐。

## 3. Styling

- [x] 3.1 在 `src/styles/opening-condition.css` 中补充识别预览确认工作台样式，保持现有企业工作台密度与主题一致。

## 4. Verification

- [x] 4.1 运行 `cmd /c node node_modules\\typescript\\bin\\tsc --noEmit`。
- [x] 4.2 运行 `openspec validate --changes opening-condition-intake-preview-confirmation`。
