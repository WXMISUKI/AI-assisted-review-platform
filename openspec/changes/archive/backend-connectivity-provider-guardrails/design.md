## Context

当前 `server/index.mjs` 已经提供 `/api/health`、`/api/llm/check`、`/api/ocr/status`、`/api/minio/status`、`/api/minio/upload`、`/api/ocr/jobs/*` 和 `/api/review-agent/stream`，前端也已经有连通性面板和上传 smoke check。问题不在“有没有接口”，而在于 provider 配置与失败响应仍然分散在多个模块中，且不同 provider 的错误表达方式不完全一致。

本次变更只做后端接入守护，不改变业务审查流程。目标是让 LLM、OCR、MinIO、SSE 的状态摘要、失败提示和起始/结束事件更加一致，便于前端诊断和后续替换真实模型。

## Goals / Non-Goals

**Goals:**

- 统一 provider 安全状态摘要，避免前端自己猜配置是否完整。
- 统一 LLM、OCR、MinIO 的失败返回结构，保留可读错误，不暴露密钥。
- 让 review SSE 的起始和结束事件更明确，便于前端判断流是否正常完成。
- 让上传、presign 和 OCR 提交路径在失败时返回稳定的诊断信息。

**Non-Goals:**

- 不在这次变更中接入真实任务队列或数据库。
- 不在这次变更中改造前端页面布局。
- 不在这次变更中更换 OCR、LLM、MinIO 的供应商。

## Decisions

### 1. 继续使用 server-side provider config，但把摘要口径统一成单一诊断对象

**Decision:** 在服务端保留环境变量驱动配置，但把 health、status 和 connectivity check 的输出收束到统一的安全摘要字段。

**Why:** 前端只应该知道“是否可用、缺了什么、下一步看哪里”，不应该接触 raw secret 或不同模块各自的半成品状态。

**Alternatives considered:**
- 让前端自己拼健康状态：实现快，但会把安全边界和诊断逻辑散到页面里。
- 新建一个配置中心服务：太重，不适合当前阶段。

### 2. 把 OCR、LLM、MinIO 的失败返回规范化

**Decision:** 所有 provider 失败都返回一致的 `ok=false`、`status`、`message`，必要时附带 `statusCode`，但不回传密钥、完整请求体或内部堆栈。

**Why:** 这样前端和日志排查能靠同一套字段工作，也方便未来替换 provider 时保持兼容。

**Alternatives considered:**
- 原样透传第三方错误：排查更直接，但会泄露过多实现细节。
- 只返回一个字符串：过于贫瘠，不利于状态面板和告警。

### 3. review SSE 使用清晰的 start/complete 事件边界

**Decision:** review stream 继续保持 SSE 形式，但强调初始连接、阶段推进和完成事件的边界，让前端更容易恢复 loading 状态并判断流是否结束。

**Why:** 当前前端已经把 SSE 当作连通性和 future review flow 的桥梁，事件边界越清楚，越容易把 mock 流替换为真实流。

**Alternatives considered:**
- 改为 WebSocket：双向能力更强，但当前并不需要。
- 只保留单个完成事件：信息不足，不适合流式观察。

### 4. MinIO 继续以私有桶为默认，但状态检查要清楚表达可达性

**Decision:** 保持对象存储以私有桶和 presigned URL 为默认路径，状态检查明确区分 endpoint、credentials、bucket 可用性。

**Why:** 这符合企业级审查文档的默认安全模型，也和后续 OCR 提交、结果归档相匹配。

**Alternatives considered:**
- 改成公开桶：操作简单，但不符合审查文档的安全预期。
- 直接在前端拼对象存储 URL：容易失控，也不利于后续权限收敛。

## Risks / Trade-offs

- [Risk] 统一错误格式可能让少量调试信息变少。→ [Mitigation] 保留服务端日志和必要的 statusCode，前端只拿安全摘要。
- [Risk] SSE 边界更严格后，旧的消费端可能需要调整。→ [Mitigation] 保持基础字段兼容，不删除当前前端已用字段。
- [Risk] 将 MinIO 继续维持私有默认可能增加配置成本。→ [Mitigation] 在 health/status 里清楚提示缺失项和推荐配置。
- [Risk] provider 守护做完后，真实业务编排仍未接入。→ [Mitigation] 这次只处理接入层，不碰任务工作流本体。

## Migration Plan

1. 先统一 `server/config.mjs` 和各 provider client 的安全摘要字段。
2. 收敛 `/api/health`、`/api/llm/check`、`/api/ocr/status`、`/api/minio/status` 的返回结构。
3. 强化 `/api/review-agent/stream` 的事件边界与完成态。
4. 让前端连通性面板和 smoke check 继续使用这些稳定字段，不改用户交互。
5. 跑 typecheck 和后端启动 smoke，确认没有破坏现有开发模式。

## Open Questions

- 后续是否需要把 provider 摘要拆成单独的 `/api/providers/status` 端点，还是继续由 `/api/health` 汇总？
- LLM 连通性检查是否要支持不同提示词模板的轻量切换，还是先保持单一检查 prompt？
- MinIO 状态里是否需要额外提示“可上传但不可公开访问”这类细粒度诊断？
