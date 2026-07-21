## 1. Spec

- [x] 1.1 更新执行台规格，明确当前运行任务优先级与归档态动作禁用。
- [x] 1.2 更新 API 规格，明确任务列表读取和归档态安全失败契约。

## 2. Implementation

- [x] 2.1 前端新增当前工作区试点任务列表解析，刷新时优先切换到最新非归档任务。
- [x] 2.2 在执行台、报告页等位置禁用归档任务的后续动作，并提示重新初始化新 run。
- [x] 2.3 在动作误命中过期/归档 taskId 时刷新并重新对齐当前运行任务。

## 3. Verification

- [x] 3.1 运行 `cmd /c node node_modules\\typescript\\bin\\tsc --noEmit`。
- [x] 3.2 运行 `openspec validate opening-condition-current-run-action-guard`。
- [x] 3.3 在 5173 页面确认归档任务只读、重新上传后新 run 成为当前运行任务。
