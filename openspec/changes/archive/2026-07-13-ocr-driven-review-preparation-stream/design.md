## Context

当前前端任务聚合仍存储在浏览器 localStorage 中，真实后端只提供 provider 接入、上传、OCR、结构水合和 SSE 连通性。为了保持 MVP 的渐进式集成，本次变更只把“真实 OCR 结构”接到“审查准备进度”这条边上，不提前引入服务端任务持久化。

## Decisions

### 1. 用 recovered structure 生成审查准备阶段

**Decision:** 在领域层提供一个阶段构建函数，输入 recovered structure 和 fallback mock stages，输出 `ReviewStreamingStage[]`。

**Why:** 页面组件不应该知道如何从章节/段落构建阶段快照；这属于审查任务编排领域逻辑。

**Fallback:** 如果 recovered structure 不存在或没有段落，继续使用现有 mock stages。

### 2. 保持 loading 页锁定态不变

**Decision:** OCR 完成后仍进入 `reviewing`/locked loading，阶段推进完成后再进入 `ready`。

**Why:** 这符合现有产品要求：任务准备完成前不允许人工操作，同时用户能观察当前结构恢复和审查准备进度。

### 3. 后端 SSE 只接结构摘要，不接完整文档正文

**Decision:** `/api/review-agent/stream` 支持 `sectionCount`、`paragraphCount`、`currentSection` 等查询参数，用于输出更贴近真实任务的阶段事件；不通过 GET 传完整 OCR 文本。

**Why:** 这样可以强化后端事件契约，又避免把长文本和潜在敏感内容塞进 URL。

### 4. 暂不生成真实 AI 问题

**Decision:** 本轮只让进度、阶段、当前段落/章节来自 OCR 结构；问题生成仍保留现有 mock issue 模型。

**Why:** 真实问题生成需要 LLM prompt、schema 校验、失败重试、证据约束和安全边界，应该作为下一组独立变更。

## Risks / Trade-offs

- [Risk] 结构驱动阶段可能让 loading 进度受 OCR 段落数量影响。  
  [Mitigation] 阶段数量固定，只把当前段落和总数映射进去。
- [Risk] SSE 结构摘要与前端本地阶段推进短期并存。  
  [Mitigation] 字段保持同一事件契约，为后续替换前端 mock 计时器做准备。
- [Risk] 旧 mock 文档没有 recovered structure。  
  [Mitigation] 保留 fallback mock stages。
