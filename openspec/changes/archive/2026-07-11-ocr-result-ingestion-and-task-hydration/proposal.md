## Why

当前系统已经能够提交 PaddleOCR 任务并轮询状态，但 OCR 完成后返回的 `resultUrl.jsonUrl` 仍然没有被真正消费。结果就是：

- 任务只能停留在“OCR 已完成”的抽象状态
- 结构恢复仍然依赖 mock 段落
- 详情页无法基于真实 OCR 输出恢复章节、段落和后续审查锚点

我们需要把 PaddleOCR 的真实结果接入现有任务态，形成一个可复用的“结果摄取 -> 结构恢复 -> 任务水合”闭环。

## What Changes

- 增加一个 OCR 结果摄取能力，支持从 PaddleOCR `resultUrl.jsonUrl` 拉取 JSONL / markdown 输出。
- 将 OCR 原始结果转换为统一的结构恢复输入，生成章节、段落、进度和可回放锚点。
- 让文档任务在 OCR 完成后自动水合 recovered structure，而不是继续停留在 mock 文档结构。
- 保持现有 review workbench、streaming progress 和 task aggregate 的接口不变，只替换其数据来源。

## Non-goals

- 不在本次变更中接入真实语义审查智能体。
- 不在本次变更中实现复杂的版面坐标还原、表格重建或图片锚点系统。
- 不在本次变更中修改报告生成逻辑。

## Impact

这次变更会影响 OCR 结果接口、结构恢复模块、任务状态同步逻辑和详情页初始数据来源，但不会改变现有页面路由或审查交互框架。
