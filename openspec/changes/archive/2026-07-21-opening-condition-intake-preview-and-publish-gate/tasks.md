## 1. Spec

- [x] 1.1 为 intake preview / publish gate 补充 proposal、design 与 specs。

## 2. Implementation

- [x] 2.1 在 `src/App.tsx` 增加当前 run basis 发布、主数据确认与 readiness 刷新逻辑。
- [x] 2.2 在资料接入页补充 preview gate 展示，并将正式核查按钮收紧到 readiness 就绪后启用。
- [x] 2.3 在依据与主数据页补充 current run / pending publish / human approved 等状态语义，降低 trial placeholder 歧义。
- [x] 2.4 清理一批易误解文案，例如未关联人工复核项时改为明确表示“无需人工复核”。

## 3. Verification

- [x] 3.1 运行 `cmd /c node node_modules\\typescript\\bin\\tsc --noEmit`。
- [x] 3.2 运行 `openspec validate opening-condition-intake-preview-and-publish-gate`。
