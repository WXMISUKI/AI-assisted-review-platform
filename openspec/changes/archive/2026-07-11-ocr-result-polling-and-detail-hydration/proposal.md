## Why

当前平台已经能把文档上传、OCR 提交和审查任务创建串起来，但“解析中”的任务还只是一个静态加载态，无法随着后台 OCR 进度自动回流到详情页，也不能在用户离开后再打开时恢复到一致状态。我们现在需要把这条链路补稳，让文档从“已提交”真正进入“可追踪的处理过程”。

## What Changes

- 为解析中的文档任务增加轮询同步能力，持续拉取 OCR 作业状态并更新任务状态。
- 让详情页的加载态能够读取任务级 OCR 进度，而不是只依赖前端本地计时器。
- 将 OCR 完成态、失败态和处理中态同步回文档库与详情页，保证刷新后还能继续查看同一任务。
- 为后续接入真实文档解析结果预留任务水位，让 outline、document、issues 三个面板可以逐步从锁定态切换到可审查态。
- 保持当前 MVP 的 mock review 结构不变，不引入真实 AI 推理或知识库检索。

## Capabilities

### Modified Capabilities
- `document-review-task`: 增加解析中任务的轮询同步、详情页回流和完成态恢复要求。

## Impact

- 前端：`src/App.tsx`、`src/domain/backendConnectivity.ts`、`src/domain/reviewSessionService.ts`、`src/domain/reviewTypes.ts`
- 后端：`server/index.mjs`、`server/ocrClient.mjs`
- OpenSpec：`openspec/specs/document-review-task/spec.md`
- 运行体验：解析中的任务将从“假定完成的本地加载”升级为“可刷新、可恢复、可观察”的任务状态流。
