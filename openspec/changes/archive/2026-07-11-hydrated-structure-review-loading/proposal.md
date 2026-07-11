## Why

我们已经把 PaddleOCR 的真实结果接入到任务里，并能恢复出 sections、paragraphs 和恢复进度。但当前工作台的“审查准备中”与“审查详情”页面仍然主要展示 mock 风格的流式阶段，真实恢复出的文档结构还没有被充分呈现给用户。

这会造成一个断层：

- 后端已经有真实 recovered structure
- 任务状态也已经保存了 recovered structure
- 但用户在等待审查时，看不到这份结构是如何被恢复出来的

## What Changes

- 在审查准备页展示 hydrated recovered structure 的摘要，包括章节数、段落数、当前章节和来源格式。
- 在锁定态详情页中使用真实 recovered structure 作为结构上下文，而不是只显示通用 mock 提示。
- 让加载页更像成熟审查平台的“文档正在被理解”状态，而不是单纯的进度条。

## Non-goals

- 不修改 OCR 解析链路本身。
- 不新增新的业务状态。
- 不把后端流式事件改成实时 SSE。

## Impact

主要影响前端 review-loading 体验和工作台中的结构摘要展示，不会改变任务流转规则。
