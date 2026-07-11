## 1. OCR 状态轮询底座

- [x] 1.1 在 `src/domain/backendConnectivity.ts` 中补充 OCR 作业状态查询的复用类型与 helper，支持按 `jobId` 拉取 pending / running / done / failed 状态。
- [x] 1.2 在 `src/domain/reviewSessionService.ts` 中补充任务状态同步入口，用于把 OCR 轮询结果回写到任务 aggregate。

## 2. 详情页状态联动

- [x] 2.1 将 `src/App.tsx` 里基于本地计时器的“解析中”流程替换为 OCR 轮询驱动，解析任务在打开详情页时可继续同步。
- [x] 2.2 让重新打开的解析中任务继续停留在锁定加载态，直到 OCR 状态变为 done 或 failed。
- [x] 2.3 在 OCR 完成时自动刷新任务状态并恢复进入详情工作台，在失败时保留失败文案并继续展示在文档库中。

## 3. 状态恢复与回归验证

- [x] 3.1 确认文档库、详情页和结果页都读取同一份任务状态，刷新后不会丢失 OCR 进度。
- [x] 3.2 做一次最小化验证：上传带 OCR 任务的文档、打开解析中任务、模拟完成/失败分支，确认 UI 状态切换符合 spec。
