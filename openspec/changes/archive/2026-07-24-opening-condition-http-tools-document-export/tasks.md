## 1. Spec and configuration

- [x] 1.1 补齐 `opening-condition-http-tools-document-export` 的 proposal、design、spec delta，并通过 OpenSpec 校验
- [x] 1.2 在后端配置中新增 `HTTP_TOOLS_BASE_URL`、路径和超时配置，并更新 `.env.example`

## 2. Backend adapter and export API

- [x] 2.1 新增 HTTP tools adapter，支持 `html2docx mode=url` 调用和安全错误归一化
- [x] 2.2 新增报告 HTML 构造逻辑，基于平台 report package 生成 bounded HTML
- [x] 2.3 新增 `/api/opening-condition/pilot-tasks/:taskId/report/export-docx` 接口，并更新 task export handoff

## 3. Frontend contract and validation

- [x] 3.1 在前端 backendConnectivity 中新增 typed export 调用
- [x] 3.2 在报告页接入导出按钮和成功/失败提示
- [x] 3.3 完成 `npm run typecheck`、OpenSpec 校验，同步主 specs 并归档
