## 1. OCR 阶段状态模型

- [x] 1.1 在 `src/domain/reviewTypes.ts` 中补充 OCR 进度字段和审查前置阶段语义，确保任务能表达 pending / running / done / failed 及百分比。
- [x] 1.2 在 `src/domain/backendConnectivity.ts` 与 `src/domain/reviewSessionService.ts` 中把 OCR 轮询结果映射为可回写的任务状态与进度信息。

## 2. 文档库与锁定页

- [x] 2.1 调整 `src/App.tsx` 的文档库列表与详情进入逻辑，让 OCR 处理中任务展示百分比并禁止直接进入审查工作台。
- [x] 2.2 将详情页的锁定加载态拆成 OCR 识别中与审查准备中两类表现，确保用户能看懂当前卡在哪一步。
- [x] 2.3 保留上传后立即出现在文档库中的体验，但把“可进入详情”改为“OCR 完成后才解锁”。

## 3. OCR 完成后的审查智能体链路

- [x] 3.1 在 OCR 完成后自动启动审查准备流程，让 review streaming 页面在结构化整理完成前保持锁定。
- [x] 3.2 在审查准备完成后再进入审查工作台，并确认 outline / document / issues 三个面板的流式状态与现有 mock 逻辑兼容。
- [x] 3.3 做一次最小化验证：上传带 OCR 任务的文档，检查进度展示、禁入态、OCR 完成后的自动转场和最终工作台解锁是否符合 spec。
