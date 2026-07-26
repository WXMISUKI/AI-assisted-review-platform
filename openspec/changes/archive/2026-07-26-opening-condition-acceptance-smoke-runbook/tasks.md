## 1. Specification

- [x] 1.1 建立 `opening-condition-acceptance-smoke-runbook` 变更，明确本次只收口验收入口与 runbook，不扩展业务状态机。

## 2. Implementation

- [x] 2.1 新增开工条件 acceptance 聚合脚本，顺序执行 domain / HTTP / UI smoke 并输出摘要。
- [x] 2.2 在 `package.json` 增加统一验收命令。
- [x] 2.3 同步单项目试点 runbook，使文档与当前验收命令保持一致。
- [x] 2.4 补轻量 smoke，锁住 acceptance script 入口。

## 3. Verification and Archive

- [x] 3.1 运行统一 acceptance 命令并确认通过。
- [x] 3.2 运行相关 smoke 回归。
- [x] 3.3 完成后归档该 change。
