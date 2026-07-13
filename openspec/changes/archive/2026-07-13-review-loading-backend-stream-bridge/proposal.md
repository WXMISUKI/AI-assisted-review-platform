## Why

我们已经把后端 review-agent SSE 做成了结构感知的 deterministic 流，也把 loading 阶段的草稿问题摘要接到了 recoveredStructure 上。但当前 review-loading 页面仍然主要依赖本地计时器推进，后端 SSE 只在连通性面板里被“看见”，没有真正成为加载态的进度源。

这会让前端、session state、后端 stream 三层之间仍然存在一段模拟层。下一步最自然的演进，是让 review-loading 在有结构上下文时优先消费后端 SSE，并在不可用时继续回退到本地 mock stages。

## What Changes

- 让 review-loading 页面优先使用后端 review-agent SSE 驱动 review-preparation 阶段推进。
- 继续保留当前本地 mock stages 作为 fallback，避免 backend 不可用时阻塞工作流。
- 让 SSE 的 stage/current paragraph/current section 信息直接驱动 loading 状态、进度和 ready unlock。
- 保持页面骨架和 review workbench 入口不变。

## Non-goals

- 不把整个 review workbench 重构为真正的实时双向流。
- 不引入新的后端持久化或队列系统。
- 不更改问题卡片交互或结果页结构。

## Impact

- `src/App.tsx`: review-loading effect 改为优先监听 SSE，并在失败时回退到本地阶段计时。
- `src/domain/backendConnectivity.ts`: 增加可复用的 SSE 订阅/流式消费 helper。
- `src/domain/reviewPreparationStages.ts`: 继续作为 fallback stage 生成器使用。
- `openspec/specs/review-streaming-api/spec.md`: 明确 review-loading 级消费场景。
- `openspec/specs/streaming-review-workbench/spec.md`: 明确 loading 页面可由后端 SSE 直接推进。
