## Why

当前系统已经能把 PaddleOCR `resultUrl.jsonUrl` 水合成 recovered structure，并把审查准备 loading 切到结构驱动模式。但工作台里的初始审查问题仍主要继承 mock 段落锚点；当 OCR 恢复结构作为真实输入时，问题卡片、原文高亮和段落分组还没有真正跟着新结构走。

这会让“真实 OCR 结构”与“工作台问题视图”之间出现最后一道断层：用户能看到真实章节，却仍在看老锚点。为了让审查流程更接近可交付状态，我们需要把现有问题锚点尽量重绑到 OCR 恢复段落上，并保留找不到锚点时的安全回退。

## What Changes

- 在任务/会话层新增一个 OCR 结构锚点重绑定能力，优先按问题原文片段寻找恢复段落中的匹配位置。
- 当 OCR 水合成功后，任务 aggregate 与 review session 会使用重绑定后的段落和问题锚点。
- 当没有可匹配段落时，继续保留原始问题和 mock 回退，不阻塞工作台。
- 让工作台的段落高亮、问题分组和当前段落上下文更贴近真实恢复结构。

## Non-goals

- 不在本次变更中接入真实 LLM 问题生成。
- 不在本次变更中改变 issue schema 或引入新的问题类型。
- 不在本次变更中修改报告生成格式。

## Impact

- `src/domain/`: 新增问题锚点重绑定 helper，并在会话服务中复用。
- `src/ReviewWorkbenchPage.tsx`: 无需改 UI 结构，但会自然消费新的锚点和分组结果。
- `openspec/specs/`: 更新 document-review-task、review-issue-model、review-workbench 的结构绑定契约。
