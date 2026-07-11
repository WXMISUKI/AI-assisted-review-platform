## Why

OCR 已经能把文件内容提取出来，但审查工作台真正需要的不是原始识别文本，而是可以定位、可以切段、可以逐段流式处理的结构化文档。现在我们还缺少一个明确的“结构恢复”层，来承接 OCR 输出并把它变成后续审查智能体可以直接消费的内容。

## What Changes

- 增加一个 OCR 后结构恢复能力，把 OCR 的 JSONL / markdown / page text 输出转换成章节、段落、页码、锚点和可回放片段。
- 让结构恢复结果成为审查编排的标准输入，而不是让审查智能体直接处理原始 OCR 结果。
- 让文档详情页可以显示结构恢复进度、当前段落位置和已恢复的章节列表。
- 将结构恢复结果保存到任务状态中，供后续审查、问题定位和报告生成复用。
- **BREAKING**: 后续审查流将默认依赖结构恢复后的文档模型，而不是直接依赖原始 OCR 文本字符串。

## Capabilities

### New Capabilities
- `ocr-structured-document-recovery`: OCR 结果结构化、段落恢复、锚点生成和可审查文档模型输出。

### Modified Capabilities
- `ocr-document-extraction`: clarify that OCR output is normalized into a reusable document structure contract.
- `document-review-task`: store and expose recovered document structure as part of the review task aggregate.
- `review-session-state`: persist structure recovery snapshots so tasks can be reopened without losing progress.
- `review-agent-orchestration`: make the structure-restoration agent consume recovered OCR output before review analysis begins.

## Impact

Frontend task state, detail-page loading UI, review session persistence, document model types, and future backend OCR processing contracts will all need to understand structure recovery as a distinct stage. This also sets the seam for later real backend ingestion of PaddleOCR JSONL and markdown output.
