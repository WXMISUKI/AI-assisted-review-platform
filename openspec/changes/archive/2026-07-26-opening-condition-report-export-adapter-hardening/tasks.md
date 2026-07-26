## 1. Specification

- [x] 1.1 补齐 `opening-condition-report-export-adapter-hardening` 的 proposal、design、delta spec，并通过 OpenSpec 校验。

## 2. Implementation

- [x] 2.1 收口开工条件导出接口失败 contract，补齐 `fallback` 与 bounded adapter diagnostics。
- [x] 2.2 固化前端导出状态消费，使开工条件导出失败时能表达适配器未配置/回退语义。
- [x] 2.3 新增开工条件专属 export smoke，覆盖缺少报告、未配置适配器、成功导出回写与 delivery package row 优先消费。

## 3. Verification and Archive

- [x] 3.1 运行开工条件导出定向 smoke。
- [x] 3.2 运行 `openspec validate --changes opening-condition-report-export-adapter-hardening --json`。
- [x] 3.3 任务完成后准备归档该 change。
