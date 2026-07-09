## Why

监理复核时不只处理 AI 自动发现的问题，也需要能直接框选原文补充人工意见。当前 MVP 已验证 AI 标注闭环，下一步需要验证“用户手动选取原文并新增标注”的交互是否顺手。

## What Changes

- 在原文段落中支持用户选中文本后创建人工标注。
- 新增人工标注表单，允许填写问题标题、不合规理由、依据和建议修改。
- 新增人工标注生成逻辑，复用现有 `ReviewIssue` 数据结构，并将 `source` 标记为 `manual`。
- 新增选区提示和取消入口，避免误选后必须刷新页面。
- 本阶段仅支持同一段落内文本选择，不支持跨段落、PDF 坐标、持久化或多人协同。

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `review-workbench`: 增加从文档原文选区创建人工标注的交互要求。
- `review-issue-model`: 明确人工标注必须复用结构化问题模型和稳定锚点。

## Impact

- 影响 `src/App.tsx` 的原文渲染、选区捕获、人工标注表单和问题状态。
- 影响 `src/styles.css` 的选区提示与人工标注表单样式。
- 不新增运行时依赖，不引入后端 API。
