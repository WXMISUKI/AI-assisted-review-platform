## Context

当前有三条相关链路：

1. OCR hydration 产出 recoveredStructure。
2. review-agent SSE 能根据 structureSummary 输出结构感知阶段。
3. review-loading 页面仍然通过本地 timer 模拟阶段推进。

这次变更要把第 2 条接到第 3 条，让 loading 真正消费后端流，同时保留 mock fallback。

## Decisions

### 1. SSE 优先，mock 兜底

**Decision:** 如果后端 SSE 可用且存在 recoveredStructure，上线时优先使用 SSE 推进 loading；如果流不可用或结构上下文缺失，继续使用本地 mock stages。
**Why:** 这样既能开始用真实后端流，又不牺牲开发期的稳定性。

### 2. 以后端事件驱动阶段状态

**Decision:** loading 页只关心后端事件里的 stage/current paragraph/current section/progress/issue summaries，不再自己重新推导这些信息。
**Why:** 减少重复逻辑，避免前后端阶段定义漂移。

### 3. 失败即回退，不阻塞任务

**Decision:** SSE 连接失败、超时或终止时，自动切换回本地 mock 阶段推进。
**Why:** review-loading 仍然是一个过渡态，不应该因为 stream 不可用而把任务卡死。

## Risks / Trade-offs

- [Risk] SSE 与本地 fallback 的切换可能造成阶段跳跃感。
  [Mitigation] 只在连接失败或完成时切换，避免中途双轨并发。
- [Risk] 前端 effect 会变复杂。
  [Mitigation] 抽出可复用的 SSE 订阅 helper，保持 App.tsx 主流程清晰。
- [Risk] 后端事件字段增加后，frontend type 可能漂移。
  [Mitigation] 同步更新 `ReviewStreamEvent` 类型和使用点。
