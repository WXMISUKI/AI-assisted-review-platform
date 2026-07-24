## Context

外部工具服务提供两个接口：

- `POST /api/capabilities/docx2html`
- `POST /api/capabilities/html2docx`

线上/线下部署的差异主要体现在 base URL、MinIO 和公网下载链接配置。因此平台不能硬编码工具服务地址，也不能让前端直接拼接调用外部工具服务。当前平台已有 `exportHandoff`，最自然的第一步是把 `html2docx` 接成后端 adapter，用平台报告包生成 DOCX 下载链接。

## Goals / Non-Goals

**Goals:**

- 通过 env 配置 HTTP tools base URL、路径和超时。
- 新增后端 adapter，调用 `html2docx` 的 `mode=url`。
- 新增试点报告导出接口，基于当前报告包生成 bounded HTML 并返回 DOCX 下载链接。
- 将导出结果写入报告资产的 `exportHandoff`，保留安全摘要和下一动作。

**Non-Goals:**

- 本次不实现完整原表回填编辑逻辑。
- 本次不调用 `docx2html` 解析原始核查表，因为还需要确认源文件 URL / presign 生命周期。
- 本次不做异步队列或高并发限流，只加同步 adapter 与超时控制。

## Decisions

### 1. 后端持有工具服务调用

前端只调用平台后端的导出接口。后端读取 env、生成 HTML、调用工具服务，并返回安全结果。

原因：工具服务地址、MinIO 下载链接和潜在认证信息都属于后端集成边界，不应暴露为前端业务拼接逻辑。

### 2. 首批只接 `html2docx mode=url`

报告包已经有结构化 findings，可以生成一份可交付 HTML，因此先接 `html2docx` 能最快形成 DOCX 下载链接。

`docx2html` 将用于后续原表回填，它需要可靠的源 DOCX URL、文件访问白名单和回填定位策略，本轮只保留配置项。

### 3. 导出结果归一化到 `exportHandoff`

adapter 返回的 `downloadUrl`、`fileKey`、`fileName`、`fileSize` 被归入平台 handoff。错误只保留安全 message/status，不记录 raw HTML 或工具服务内部堆栈。

## Risks / Trade-offs

- [风险] 工具服务未配置时用户点击导出会失败。  
  → Mitigation：返回 `not_configured` 安全错误，并在 handoff 中展示下一步配置动作。

- [风险] 同步调用在大报告上可能超时。  
  → Mitigation：首批提供 `HTTP_TOOLS_TIMEOUT_MS`，后续再升级队列。

- [风险] 生成 HTML 与最终原表格式仍有差距。  
  → Mitigation：本轮定位是 DOCX 报告导出，不冒充完整原表回填。
