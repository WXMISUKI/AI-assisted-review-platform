## 1. 规格

- [x] 1.1 建立“任务生命周期精确持久化闭环”变更，明确本次只覆盖 delete API 和关键 checkpoint 持久化。
- [x] 1.2 明确哪些状态需要 task-scoped upsert，哪些仍保持本地缓存。

## 2. 实现

- [x] 2.1 为 review task store 与 API 增加 task-scoped DELETE 能力。
- [x] 2.2 前端删除任务切换为精确 delete，不再使用 bulk replace。
- [x] 2.3 为上传、OCR 终态、准备包、draft issues、generation terminal、ready 收口等关键 checkpoint 增加单任务 upsert。
- [x] 2.4 保持 stream stage、view context 等高频 UI 状态不额外触发后端写入。

## 3. 验证

- [x] 3.1 运行 `pnpm typecheck`。
- [x] 3.2 运行 `pnpm smoke:review`。

## 4. 归档

- [x] 4.1 回写本变更任务状态。
- [x] 4.2 在路线图中补充“剩余高频 UI 状态仍为本地缓存，后续如需审计再扩展”的说明。
