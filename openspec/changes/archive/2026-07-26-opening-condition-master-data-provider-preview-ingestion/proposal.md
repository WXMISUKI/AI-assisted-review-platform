## Why

开工条件平台当前已经把 run 生命周期、报告交付包、DOCX 导出 handoff 和归档只读约束做得比较稳，但真实投产还差一个更前置的关键解释层：平台怎样从真实文件里形成“候选主数据事实”，并在人工确认前清楚告诉操作者它到底识别了什么、缺了什么、为什么暂时不能直接用于正式核查。

现在 `basis` 已经有 `provider-preview` 入口和受治理的预览生命周期，但 `master-data` 仍主要停留在候选记录/确认/发布语义，缺少与 basis 对齐的 provider structured preview ingestion。这会导致真实联调时，人员、设备、证照和主体事实看起来像“平台突然有了一个 provisional record”，而不是“平台根据哪份文件提取了哪些候选字段、缺失哪些字段、下一步为什么需要人工确认”。

这一步比继续美化页面或继续深挖导出更有 MVP 价值，因为它直接降低真实样本试点时最常见的不信任问题：平台为什么认为这个人员/设备/证照事实可以被当前 run 使用。

## What Changes

- 为 workspace master-data records 增加 provider structured preview ingestion 入口，与 basis preview 的治理模式保持一致。
- 让 master-data candidate preview 可以记录安全的结构化 facts、missing fields、confidence、source evidence、provider provenance 和 next action。
- 明确 provider preview 只能进入 candidate preview，不得绕过人工确认/发布直接变成 formal matching 可用事实。
- 补齐 operator-facing readiness/preview 语义，使当前 run 能清楚区分 provisional candidate、human-approved current-run fact 和 reusable published catalog fact。
- 增加 focused smoke/test，覆盖 master-data provider preview 的 ingest、sanitize、decision 和 readiness gating。

## Capabilities

### Modified Capabilities
- `opening-condition-master-data`: 为主数据候选记录补充 provider preview ingestion 与更清晰的 candidate preview contract。
- `opening-condition-pilot-operational-api`: 暴露 master-data provider preview ingestion API 与安全返回语义。
- `opening-condition-intake-preview-and-publish-gate`: 让 intake gate 解释 provider-derived master-data candidate 为何仍需确认/发布。

## Impact

- 受影响代码：
  - `server/openingConditionPilotStore.mjs`
  - `server/index.mjs`
  - `src/domain/backendConnectivity.ts`
  - 开工条件相关 smoke / focused backend tests
- 不改主状态机，不接真实 OCR/MaxKB 调用，不扩散到施工审查平台。
