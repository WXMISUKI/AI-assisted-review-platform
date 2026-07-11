## Why

成熟的文档审查平台通常不会把原始文件直接交给审查智能体，而是先完成 OCR / 版面结构化解析，再进入审查和问题生成阶段。我们现在需要把这条闸门明确下来，让文档在 OCR 完成前只显示接入进度，避免用户过早进入尚未可审查的详情页。

## What Changes

- 将文档接入流程明确拆分为 OCR 识别阶段和审查智能体阶段。
- 在文档库中展示 OCR 处理中状态和进度百分比，未完成前禁止进入审查工作台。
- OCR 完成后，任务自动进入审查准备 / 审查处理中状态，再由智能体完成内容整理、结构化和问题生成。
- 详情页从“已上传即进入工作台”调整为“识别完成后再进入工作台”的锁定-解锁流程。
- **BREAKING**：上传后可直接进入审查详情的体验将改为先看 OCR 进度页，直到识别完成才解锁审查能力。

## Capabilities

### Modified Capabilities
- `document-review-task`: 明确 OCR 阶段与审查阶段的分界，增加 OCR 进度展示、未完成前禁止进入详情工作台、OCR 完成后再启动审查智能体的要求。

## Impact

- 前端：`src/App.tsx`、`src/domain/backendConnectivity.ts`、`src/domain/reviewSessionService.ts`、`src/domain/reviewTypes.ts`
- 后端：`server/index.mjs`、`server/ocrClient.mjs`
- OpenSpec：`openspec/specs/document-review-task/spec.md`
- 运行行为：文档库、详情页和流式审查工作台的进入条件将从“上传完成”转为“OCR 完成”。
