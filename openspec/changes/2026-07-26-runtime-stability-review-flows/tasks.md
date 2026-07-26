## 1. 规格与边界

- [x] 1.1 为开工条件报告工作台崩溃和施工方案任务快照过大建立单独稳定性变更。
- [x] 1.2 确认本次变更只覆盖运行时稳定性，不扩展业务功能。

## 2. 开工条件报告工作台稳定性

- [x] 2.1 将阻塞复核计数收敛为单点稳定派生值，消除 `selectedOpenReviewCount` 渲染期崩溃触发面。
- [x] 2.2 让报告包构建、按钮可用性和提示文案统一复用该派生值。

## 3. 施工方案任务体积控制

- [x] 3.1 调整 `createDocumentTask`，使 `uploaded` / `parsing` 状态只创建轻量占位任务，不再克隆整份 demo 文档段落。
- [x] 3.2 保证后续 OCR/解析成功后，真实 `recoveredStructure` 和问题列表仍能正常回填。

## 4. 本地持久化与后台同步容错

- [x] 4.1 保证 `saveReviewTasks` 在本地存储配额不足时不向上抛出未捕获异常。
- [x] 4.2 保持 bulk 同步为尽力而为，不阻塞当前内存态交互。

## 5. 验证

- [x] 5.1 运行 `pnpm typecheck`。
- [x] 5.2 运行 `pnpm smoke:review` 与 `pnpm smoke:review:docx`。
- [x] 5.3 运行 `pnpm smoke:product-boundaries`。
