## 1. Spec Completion

- [x] 1.1 完成 intake itemized confirmation 的 proposal、design、specs 与任务拆分。

## 2. Itemized Confirmation Actions

- [x] 2.1 在 `src/App.tsx` 中补充 basis 候选备注发布与 master-data 候选逐条确认/驳回处理函数。
- [x] 2.2 在 `src/productWorkspacePages.tsx` 中为资料接入页候选预览区增加逐条动作与备注输入。
- [x] 2.3 保持现有批量确认路径可用，并让逐条动作与当前 run 状态刷新联动。

## 3. Styling

- [x] 3.1 在 `src/styles/opening-condition.css` 中补充候选逐条确认表单与动作区样式。

## 4. Verification

- [x] 4.1 运行 `cmd /c node node_modules\\typescript\\bin\\tsc --noEmit`。
- [x] 4.2 运行 `openspec validate --changes opening-condition-intake-itemized-confirmation`。
