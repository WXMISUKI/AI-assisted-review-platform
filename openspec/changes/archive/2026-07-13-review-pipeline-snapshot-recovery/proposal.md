# Review pipeline snapshot recovery

## Why

目前 review-loading 已经可以优先消费后端 review-agent SSE，并在不可用时回退到本地 mock stages。问题在于，这套进度仍然主要靠分散的 task 字段维持，恢复时依赖页面自己拼装上下文。

这会让“当前阶段、当前章节、当前段落、最后一次进度”在 session、存储和 loading 入口之间出现轻微分叉。下一步更稳妥的演进，是把 loading 过程沉淀成一个规范化的 pipeline snapshot，让刷新、重开和后端 SSE 的进度恢复使用同一份状态。

## What Changes

- 为 review task 增加一个规范化的 pipeline snapshot 载体。
- 在 session service 中写入、更新和恢复该 snapshot，保持和既有 stream 字段兼容。
- 在 task repository 加载旧数据时回填 snapshot，避免老记录失去恢复能力。
- 让 loading / orchestration 入口优先读取 snapshot，而不是各自重建。
- 保持现有页面结构和 SSE fallback 行为不变。

## Non-goals

- 不引入真实后端持久化。
- 不改 review workbench 的视觉结构。
- 不把 mock stream 改造成双向协议。

## Impact

- `src/domain/reviewTypes.ts`
- `src/domain/reviewPipelineSnapshot.ts`
- `src/domain/reviewSessionService.ts`
- `src/domain/reviewTaskRepository.ts`
- `src/domain/reviewTaskOrchestration.ts`
- `src/App.tsx`
- `openspec/specs/review-session-state/spec.md`
- `openspec/specs/streaming-review-workbench/spec.md`
