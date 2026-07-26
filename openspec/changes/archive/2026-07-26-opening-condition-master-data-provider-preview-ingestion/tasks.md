## 1. Specification

- [x] 1.1 补齐 `opening-condition-master-data-provider-preview-ingestion` 的 proposal、design、delta spec，并通过 OpenSpec 校验。

## 2. Implementation

- [x] 2.1 为 master-data records 增加 provider preview ingestion 后端能力与安全归一化逻辑。
- [x] 2.2 暴露 master-data provider preview ingestion API，并在前端 connectivity/调用层补齐 typed contract。
- [x] 2.3 补 focused backend test 或 smoke，覆盖 provider preview sanitize、候选状态保持、以及 readiness 不被自动放行。

## 3. Verification and Archive

- [x] 3.1 运行开工条件相关 focused tests / smoke。
- [x] 3.2 运行 `openspec validate --changes opening-condition-master-data-provider-preview-ingestion --json`。
- [x] 3.3 任务完成后归档该 change。
