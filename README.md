# AI-assisted-review-platform

AI 辅助施工方案审查平台。

当前阶段是交互 MVP：使用 mock 施工方案和 mock AI 审查结果，验证“原文标注 + 右侧审查意见 + 接受/拒绝/修改后接受 + 处理后方案预览”的核心产品体验。

## 本地运行

```bash
pnpm install
pnpm dev
```

`pnpm dev` 会同时启动本地 BFF 后端和 Vite 前端：

- 后端：`http://127.0.0.1:8787`
- 前端：`http://127.0.0.1:5173`
- 前端 `/api/*` 请求会由 Vite 代理到本地后端。

如果只需要调试前端，或后端已经在另一个终端启动：

```bash
pnpm dev:frontend
pnpm server:dev
```

默认访问地址：

```text
http://127.0.0.1:5173/
```

## 轻量验证

```bash
pnpm typecheck
```

## 当前边界

- 已接入 OpenAI-compatible LLM、MinIO 上传桥和 PaddleOCR 任务提交底座，仍未完成完整异步解析落库。
- 未接入 Dify、LangGraph 或规范知识库。
- 未接入数据库、权限、上传、报告导出。
- 当前重点是验证文档上传、OCR 任务提交、审查工作台交互和结构化问题模型。
