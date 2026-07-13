## Why

后端已经能够提交 OCR、轮询结果，并把 PaddleOCR `resultUrl.jsonUrl` 水合成 recovered structure。当前缺口在下一段：OCR 结构恢复后，审查准备 loading 仍主要依赖固定 mock streaming stages，进度锚点和当前章节不一定来自真实 OCR 段落。

如果不先收紧这层，后续接入真实 LLM 审查时会出现“文档结构是真实的，但审查流仍按演示段落推进”的断层，影响可恢复状态、问题锚点和用户对处理进度的判断。

## What Changes

- 让审查准备阶段优先使用 recovered structure 中的章节和段落生成流式阶段快照。
- 保持现有 mock 任务和未完成 OCR 的兜底行为，不改变页面路由或人工审查操作。
- 扩展 review SSE 的事件生成能力，使其可以接收结构摘要参数并输出结构恢复、依据绑定、审查分析、问题结构化、结果包装等阶段事件。
- 更新相关 OpenSpec 规格，明确 OCR 水合结构进入审查准备流的契约。

## Non-goals

- 不在本次变更中接入真实语义审查模型输出。
- 不在本次变更中引入数据库、任务队列或服务端任务持久化。
- 不在本次变更中实现规范知识库检索、坐标级 OCR 锚点或表格重建。

## Impact

- `src/domain/`: 新增或调整审查准备阶段生成逻辑，使其由 recovered structure 驱动。
- `src/App.tsx`: OCR 完成后进入 loading 时使用真实结构生成进度快照。
- `server/reviewAgentStream.mjs`: SSE 事件兼容结构摘要输入，继续保持旧连通性消费者可用。
- `openspec/specs/`: 更新 review orchestration、review streaming、session state 的契约。
