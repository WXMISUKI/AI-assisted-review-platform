## Context

仓库中已经存在：

- `smoke:opening-condition`
- `smoke:opening-condition:http`
- `smoke:opening-condition:ui`

它们分别守住领域状态机、API 链路和页面边界，但当前没有单入口把三者收口为一份“试点验收”动作。

## Goal

- 用最小改动提供统一 acceptance 入口。
- 保持底层 smoke 分层不变，只增加聚合执行与摘要输出。
- 让 runbook 与脚本保持一致。

## Non-Goals

- 不新增新的业务状态机。
- 不引入复杂测试框架或 CI 编排。
- 不重写既有 smoke 内容。

## Decisions

### 1. 聚合既有 smoke，而不是复制测试逻辑

决定：

- 新增一个轻量 Node 脚本，顺序执行既有三条 smoke 命令；
- 输出每一层是否通过与总结果。

原因：

- 既有 smoke 已经是稳定护栏；
- 重新拼装测试逻辑只会制造第二套事实来源。

### 2. package script 作为操作者入口

决定：

- 在 `package.json` 增加 `smoke:opening-condition:acceptance`。

原因：

- 联调和试点更需要固定命令，而不是记忆多个文件路径。

### 3. runbook 只同步最小必要步骤

决定：

- 在单项目试点 runbook 中明确三层 smoke 的统一入口和预期。

原因：

- 这轮目标是提升可重复验收，而不是扩写大量操作手册。

## Risks / Trade-offs

- [风险] 聚合脚本失败时，输出不够清楚。
  - Mitigation：保留子命令名称和失败层级。

- [风险] 后续某条 smoke 改名导致入口漂移。
  - Mitigation：在 product boundary smoke 中锁住 package script。
