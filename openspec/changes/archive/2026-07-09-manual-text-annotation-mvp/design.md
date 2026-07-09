## Context

当前工作台已经能展示 mock AI/人工问题，并支持右侧卡片处理闭环。但人工问题仍来自 mock 数据，无法模拟监理在阅读方案时主动选取原文新增审查意见的真实路径。

## Goals / Non-Goals

**Goals:**

- 用户可在当前 HTML 段落原文中拖选一段文本。
- 系统识别选区所在段落、起止字符 offset 和选中文本。
- 用户可基于选区填写人工标注表单。
- 提交后新增一条 `source: manual`、`status: pending` 的 `ReviewIssue`。
- 新增标注立即出现在原文高亮和右侧卡片列表中。

**Non-Goals:**

- 不支持跨段落选区。
- 不支持 PDF/DOCX 真实坐标。
- 不持久化人工标注。
- 不实现复杂标注分类、协同评论或附件上传。

## Decisions

### Decision 1: 使用 Selection API 捕获 HTML 原文选区

当前原型渲染的是普通 HTML 文本，浏览器原生 `window.getSelection()` 能快速验证选区体验。选区必须落在同一个段落容器内，系统通过 `Range` 前置文本长度计算 `startOffset` 和 `endOffset`。

### Decision 2: 表单内联显示在文档区顶部

选区创建后，在文档区显示紧凑的人工标注表单，展示选中文本并收集标题、理由、依据和建议修改。这比弹窗更能让用户保持文档上下文，也更符合审查工作台的密集工具体验。

### Decision 3: 人工标注复用 ReviewIssue

人工标注不创建新模型，继续使用 `ReviewIssue`，只将 `source` 设置为 `manual`。这样右侧卡片、状态筛选、处理后预览和后续持久化都无需分叉。

## Risks / Trade-offs

- 选区 offset 与 React 拆分高亮后的 DOM 结构有关 -> 本阶段只按段落容器 `textContent` 计算，后续 PDF 阶段改用解析层锚点。
- 跨段落选择无法创建 -> 在提示中明确“请选择同一段落内文本”。
- 与现有高亮文本重叠时可能产生重叠标注 -> 原型先允许创建，后续生产版本需增加重叠检测和合并策略。
