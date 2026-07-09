# 施工方案审查交互 MVP 实现归档

## 本次交付

- 初始化 OpenSpec 与 CodeGraph。
- 创建 `interactive-review-mvp` OpenSpec 变更，包含 proposal、design、capability specs 和 tasks。
- 搭建 React + Vite + TypeScript 前端原型。
- 定义审查问题结构化模型：问题来源、状态、风险等级、文档锚点、问题说明、规范依据、建议修改、人工处理结果。
- 使用 mock 施工方案和 mock AI/人工问题实现工作台。
- 实现原文高亮、右侧问题卡片、状态筛选、双向定位、接受、拒绝、修改后接受、处理后方案预览。

## 产品结论

施工方案审查平台的核心不是简单 AI 问题列表，而是以文档锚点为中心的协同审查工作台。前后端、AI、文档解析和报告生成都应围绕同一份 `ReviewIssue` 契约展开。

## 技术边界

本次原型使用 HTML 段落模拟文档，不处理 PDF 坐标、分页、缩放和跨页标注。后续接入真实 PDF 时，需要增加 PDF 标注 spike，优先验证以下能力：

- PDF 文字层选区是否能稳定映射到 `page + rects + text`。
- AI 返回的 `anchor.text` 是否能在解析文本中稳定回填。
- 缩放、滚动、跨页标注是否能保持定位准确。
- 已接受/已拒绝状态是否能同步到最终报告。

## 推荐下一组任务

1. 新建 OpenSpec change：`pdf-annotation-spike`。
2. 引入 `react-pdf-highlighter` 或等价 PDF.js 标注组件。
3. 用一份真实施工方案 PDF 验证文字高亮、右侧卡片定位和跨页问题。
4. 引入 MinerU 或 PyMuPDF 评估解析质量。
5. 设计后端 API：上传文档、获取解析段落、提交 AI 审查任务、流式返回问题、保存人工处理结果。
