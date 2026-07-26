## Context

开工条件 MVP 当前已经具备：

- `basis` 侧的 deterministic extract 与 `provider-preview` 受治理接入；
- `master-data` 侧的候选记录、人工确认/拒绝、发布、current-run gate；
- formal matching 对 `published` / `human_approved` master-data 的门禁依赖。

但 `master-data` 和 `basis` 的预览治理还不对称：

- basis 有专门的 provider structured preview ingestion 入口；
- master-data 没有对应的 provider-preview action；
- 因此主数据候选虽然能存在，却不够清楚地解释“候选事实从哪里来、哪些字段缺失、provider 提取了什么、下一步为何仍需人工确认”。

## Goals / Non-Goals

**Goals**

- 为 master-data records 增加与 basis 对齐的 provider preview ingestion action。
- 让 provider-derived master-data candidate preview 只保留 bounded facts、source evidence、confidence、missing fields、provenance 和 next action。
- 保持 `human_approved` 与 `published` 的既有兼容语义，但让 operator-facing 文案更清楚。
- 让 preflight/intake gate 能解释 provider-derived candidate 仍然为何不可直接绕过确认/发布。

**Non-Goals**

- 不接真实 provider 网络调用；本轮只治理“平台如何接住 provider 已给出的结构化输出”。
- 不重做 basis preview 逻辑，只复用其模式。
- 不做完整 UI 重构。

## Decisions

### 1. 复用现有 master-data record shape，不额外创建独立 preview collection

决定：

- 在现有 `masterDataRecord.preview` 内扩展 provider-derived preview 元信息；
- API 仍挂在现有 `/workspaces/:workspaceId/master-data/:recordId/*` 下面。

原因：

- 当前文件型 store 和前端读取路径已经稳定，继续增量扩展风险最小。

### 2. 新增 `provider-preview` action，而不是复用 `PUT record`

决定：

- 新增 `POST /api/opening-condition/workspaces/:workspaceId/master-data/:recordId/provider-preview`；
- 它的职责只是在既有主数据记录上刷新 preview，不直接改变为 `published`。

原因：

- 这样能把“候选事实接入”和“记录确认/发布”明确分开，避免调用方误以为 provider 结果等于正式主数据。

### 3. 复用 basis provider preview 的 sanitize 原则

决定：

- 过滤 token、credential、prompt、raw OCR text、private URL、cookie、session、trace 等 unsafe fields；
- 只保留 bounded snippets、facts、source labels、confidence、matched signals、provider ids。

原因：

- 开工条件平台必须始终由平台 own 业务事实，provider 只提供候选预览，不应泄露原始不受控 payload。

### 4. 当前 run readiness 仍只看 `human_approved` / `published`

决定：

- provider preview ingestion 后，master-data record 默认仍是 `provisional` 或既有安全状态；
- formal matching 与 intake gate 继续只认 `human_approved` / `published` 为可用事实；
- preview 负责解释差距，而不是自动跨越差距。

原因：

- 这符合 MVP 一贯原则：先有解释清楚的候选事实，再由人工决定能否进入正式核查。

## Risks / Trade-offs

- [风险] preview 字段更多后，单条主数据记录会显得更重。
  -> Mitigation：只增加 bounded preview 元信息，不增加新的业务状态层。

- [风险] 继续保留 `human_approved` 兼容语义，可能让后续正式生产规则看起来不够纯。
  -> Mitigation：本轮只增强 operator-facing label，并保持 spec 明确 `published` 才是 reusable catalog fact。
