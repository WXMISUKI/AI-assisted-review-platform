## Why

报告 DOCX 导出接口已经可用，但报告页没有展示导出成功或失败状态，浏览器拦截异步新窗口时用户会误以为按钮没有反应。历史轮次查看时，导出回调也可能错误使用当前 run。

## What Changes

- 在报告页展示 DOCX 导出的进行中、成功和失败状态。
- 成功后提供明确的下载链接，不依赖异步 `window.open`。
- 导出时使用报告页当前选中的 run，支持历史归档轮次导出。

## Capabilities

### New Capabilities
- `opening-condition-report-export-feedback`: 定义报告导出的用户反馈、下载入口和选中轮次语义。

### Modified Capabilities

## Impact

- 受影响代码：`src/App.tsx`、`src/productWorkspacePages.tsx`
- 不修改后端导出协议和外部 HTTP tools 配置。
- 不改变报告资产、核查结论或归档状态。
