## Why

开工条件报告包已经具备 `exportHandoff`，但还没有真正接到可配置的文档转换服务。现在用户已提供 `docxToHtml` / `htmlToDocx` 接口文档，下一步应先把工具服务作为后端可配置 adapter 接入，避免线上/线下部署时把 IP、端口或路径写死在代码里。

本变更先完成最短投产价值：基于平台结构化报告包调用 `htmlToDocx` 生成 DOCX 下载链接，并把工具服务健康状态、错误和导出结果作为安全摘要返回。`docxToHtml` 原表回填读取能力保留在同一 adapter contract 中，但真实原表回填需要稳定源文件 URL / presign 策略，放到后续切片。

## What Changes

- 新增 HTTP tools 服务配置：`HTTP_TOOLS_BASE_URL`、`HTTP_TOOLS_TIMEOUT_MS`、`HTTP_TOOLS_HTML2DOCX_PATH`、`HTTP_TOOLS_DOCX2HTML_PATH`。
- 新增服务端 adapter，封装 `html2docx` URL 模式调用并归一化成功/失败结果。
- 新增开工条件报告 DOCX 导出接口，基于 task/reportAsset/packageDiagnostics 生成 bounded HTML，再调用 `html2docx`。
- 将导出结果写回或返回到 `exportHandoff` 语义中，保留下载链接、fileKey、文件名、文件大小和安全诊断。
- 暂不直接执行 `docx2html` 原表解析；仅在配置和 adapter contract 中预留能力。

## Capabilities

### New Capabilities
- `http-tools-document-conversion-adapter`: 定义平台如何配置、调用和安全归一化外部 docx/html 工具服务。

### Modified Capabilities
- `opening-condition-export-handoff`: export handoff 需要支持真实 `html2docx` 导出结果、工具服务状态和 adapter-safe 诊断。
- `opening-condition-pilot-operational-api`: 试点 API 需要暴露报告 DOCX 导出接口，返回安全导出结果和刷新后的报告 handoff。

## Impact

- 受影响代码：
  - `server/config.mjs`
  - `server/index.mjs`
  - 新增 HTTP tools adapter
  - `server/openingConditionPilotStore.mjs`
  - `src/domain/backendConnectivity.ts`
  - `.env.example`
- 受影响系统：
  - 开工条件报告导出
  - 原表回填/导出 adapter handoff
  - 线上/线下环境配置
- 不新增前端直连外部工具服务；所有调用必须经后端。
