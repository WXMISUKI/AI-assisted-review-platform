## Why

当前真实试点已经可以上传资料、初始化 run、执行正式核查，但操作员在进入正式核查前仍看不清“这次接入到底准备发布什么事实”。这会让 basis、master data、trial placeholder、knowledge-base readiness 混在一起，既影响信任，也让 formal match 的阻塞原因显得像黑箱。

## What Changes

- 在资料接入页增加“接入预览与发布门禁”视图，按当前 run 展示 basis、master data、knowledge base 的预览状态与正式核查前置条件。
- 在执行台增加显式动作，让操作员可以先发布当前 run 绑定依据，再确认当前 run 需要的主数据，然后再执行正式核查。
- 将“执行正式核查”按钮与文案门禁收紧到 preview/publish gate 完成之后，而不是只依赖后端报错回显。
- 在依据与主数据页补充 current run、pending publish、human approved 等状态语义，降低 trial placeholder 与正式记录的混淆。
- 清理部分容易引起误解的说明文案，例如未关联人工复核项时不再暗示“异常未处理”。

## Capabilities

### New Capabilities
- `opening-condition-intake-preview-and-publish-gate`: 定义真实试点资料接入后的预览确认、依据发布、主数据确认与正式核查前置门禁。

### Modified Capabilities
- `opening-condition-pilot-execution-console`: 正式核查动作需体现 preview/publish gate 状态，并在前端明确禁用与提示。
- `opening-condition-single-project-trial-intake`: 资料接入页需要把 bootstrap/intake 结果展示为可确认的当前 run 预览，而不是只有接入摘要。

## Impact

- `src/App.tsx`：增加 basis 发布、主数据确认与正式核查门禁控制。
- `src/productWorkspacePages.tsx`：新增接入预览/发布门禁展示，调整资料接入页与依据主数据页文案和动作。
- `src/styles.css`：补充预览门禁与状态摘要样式。
- 复用既有后端接口：`/basis/:id/publish`、`/master-data/:id/decision`、`/pilot-tasks/:taskId/readiness`。
