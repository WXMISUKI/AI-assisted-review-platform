# 双产品并行开发规范补充

更新时间：2026-07-24

这份文档补充现有 `docs/development-standards.md`，专门约束施工方案审查与开工条件核查并行开发。

## 归属原则

- 施工方案审查拥有文档任务、OCR/结构准备、问题锚点、人工决策、审查结果和处理后方案快照。
- 开工条件核查拥有工作区、依据、主数据、资料包、核查项、人工复核、整改复审、报告归档和 DOCX 导出。
- 平台共用层只拥有产品启动器、壳层、主题 token、provider/对象存储适配器、报告交付 handoff 和安全诊断摘要。

## 状态原则

- 页面局部状态可以留在 React 组件。
- 跨页面、跨刷新、可审计的状态必须由领域服务或后端快照持有。
- 两个产品不得复用同一个业务状态枚举来表达不同含义。
- provider readiness 只能作为门禁或诊断输入，不能直接成为业务审查结论。

## 样式原则

- 全局 token：`src/styles/theme-tokens.css`。
- 共用壳层和组件：`src/styles/shared-foundation.css`。
- 施工方案：`src/styles/construction-plan.css`。
- 开工条件：`src/styles/opening-condition.css`。
- 新增产品样式不得继续堆入 `src/styles.css`；根入口只负责加载分层文件。

## 重构原则

大型文件不得一次性重写。按以下顺序拆分：

1. 类型、常量和纯函数。
2. API/状态服务。
3. 页面区块和组件。
4. 删除已迁移的重复实现。

每个切片完成后运行：

```text
pnpm governance:check
pnpm typecheck
pnpm smoke:product-boundaries
```

然后再运行对应产品的完整 smoke。

