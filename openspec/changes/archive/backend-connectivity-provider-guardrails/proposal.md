## Why

当前后端已经具备 LLM、OCR、MinIO 和 review SSE 的基础端点，但它们的配置校验、错误返回和安全摘要还不够统一。随着我们开始接真实模型与对象存储，必须先把 provider 级别的守护和可诊断性收紧，否则前端会在错误状态和空配置之间反复猜测。

## What Changes

- 统一后端 provider 的安全状态摘要，让健康检查、连通性检查和前端状态卡显示同一套配置口径。
- 明确 OpenAI-compatible LLM、PaddleOCR、MinIO 三类 provider 的失败返回格式，避免把密钥或内部错误细节直接暴露给前端。
- 强化 review SSE 的事件初始状态与结束状态，让流式通道更容易映射到前端的锁定/恢复界面。
- 规范 MinIO 上传和 presign 的错误边界，帮助排查“上传可用但 OCR 不可用”或“对象存储可用但桶不可访问”这类场景。

## Capabilities

### New Capabilities
- 无

### Modified Capabilities
- `backend-connectivity`: 健康检查与 provider 摘要需要更统一的安全输出。
- `ocr-document-extraction`: OCR 状态和作业提交返回需要更可诊断的失败信息。
- `llm-agent-adapter`: LLM 连通性检查需要更稳定的模型、baseURL 和安全错误摘要。
- `review-streaming-api`: review SSE 需要更明确的阶段起止事件，便于前端恢复和观察。

## Impact

- `server/`: 配置读取、provider 状态摘要、LLM/OCR/MinIO 接口返回和 SSE 事件格式会更统一。
- `src/domain/backendConnectivity.ts`: 前端连通性检查和状态面板会消费更稳定的返回结构。
- `docs/`: 需要补充后端 provider guardrails 和环境变量配置约定。
