# 施工方案 DOCX 解析与真实审查问题生成

变更日期：2026-07-24

## 背景

当前施工方案审查通过 PaddleOCR 处理上传文件，但 DOCX 文件经过 OCR 后产生乱码内容。实际施工方案以 DOCX 格式为主，需要原生解析。同时审查问题生成使用 mock 数据，无法基于真实内容审查。

## 架构决策

- D1: 后端 Node.js 使用 yauzl 解压 DOCX，解析 word/document.xml
- D2: 后端根据 contentType 或扩展名自动分流（DOCX 走解析，PDF 走 OCR）
- D3: 直接输出 RecoveredDocumentStructure，下游管道零改动
- D4: 表格每行转为段落，前缀标注行列信息
- D5: 图片位置插入标记，不做 OCR 识别
- D6: 规则引擎预检 + LLM 按章节分批审查
- D7: 每次发一个章节内容给 LLM，可并行
- D8: 通用 prompt + 规则预检结果

## Requirements

### Requirement: DOCX 文件原生解析
系统支持从 DOCX 文件中提取章节结构、正文段落、表格内容和图片位置。

### Requirement: 基于规则的审查预检
规则引擎扫描文档内容，标记已知风险模式。

### Requirement: LLM 真实审查问题生成
LLM 基于实际文档内容和规则预检结果生成审查问题。

## 修改文件清单

- server/docxParser.mjs (新建)
- server/reviewRuleEngine.mjs (新建)
- server/reviewLlmGenerator.mjs (新建)
- server/reviewDraftIssueAdapter.mjs (修改)
- server/index.mjs (修改)
- src/domain/reviewTypes.ts (修改)

## 验证命令

pnpm typecheck
pnpm smoke:review
pnpm smoke:product-boundaries
