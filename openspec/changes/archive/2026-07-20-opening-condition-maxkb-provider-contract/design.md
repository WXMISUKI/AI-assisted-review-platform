## Context

当前平台已经有外部 provider 原则：平台拥有事实与状态，外部 provider 只提供 OCR、LLM、对象存储、知识召回等能力。`knowledgeBaseProvider.mjs` 已经支持 mock 与 RAGFlow 风格 provider，opening-condition pilot store 也能保存 `providerRefs` 和 `providerSyncStatus`。

新的 handoff 文档说明，外部 MaxKB 与 OCR Worker 已经完成“项目级知识库 + OCR 入库 + retrieval-check”的本地闭环。平台现在缺的不是继续在 MaxKB 里堆业务逻辑，而是建立 MaxKB provider 契约：平台如何绑定项目级知识库、如何保存 provider refs、如何展示 readiness、哪些状态由平台保存、哪些结果只作为支持性证据。

## Goals / Non-Goals

**Goals:**

- 让知识库 provider 支持 `maxkb`，并继续保留 `mock` / `ragflow` 兼容。
- 建立 MaxKB 项目级知识库绑定的安全 provider refs 结构。
- 增加 MaxKB readiness/config summary，供 `/api/health` 与 `/api/knowledge-base/provider/status` 使用。
- 补充对接文档，指导前置平台团队准备接口、metadata、状态流和审计字段。

**Non-Goals:**

- 不实现完整 Project / ContractPackage / Evidence / OcrIngestionLink 数据库迁移。
- 不让浏览器直接调用 MaxKB 或 OCR Worker。
- 不实现 OCR Worker 全链路联调。
- 不把 MaxKB retrieval hit 当成正式审查结论。

## Decisions

### 1. Provider 抽象采用 `KNOWLEDGE_PROVIDER`

决策：新增 `KNOWLEDGE_PROVIDER=maxkb|ragflow|mock`，MaxKB 配置使用 `MAXKB_*`，RAGFlow 配置继续保留。

原因：

- 当前代码已经有 provider adapter 形态，扩展 provider 类型比复制一套 MaxKB 专用代码更稳。
- 前端和业务 store 只需要看安全摘要与 provider refs，不应知道底层 provider 细节。
- 保留 RAGFlow 兼容，避免未来切换 provider 时重写平台契约。

### 2. MaxKB 第一阶段只做 provider refs 与 readiness

决策：本轮只实现 MaxKB 配置、安全健康摘要、provider ref 归一化、文档和检索结果的安全格式，不直接打通 OCR Worker 入库。

原因：

- Handoff 已经明确 OCR Worker 侧负责 OCR、后处理、入库 MaxKB、retrieval-check。
- 平台当前更缺的是绑定与审计契约，而不是重复实现 Worker 能力。
- 这能最快支持前置平台联调，同时不扩大事实源边界。

### 3. MaxKB 知识库粒度以项目级为默认

决策：第一阶段 provider refs 保存项目级 `knowledgeId`，合同段、队伍、审查任务通过 metadata 和平台记录绑定。

原因：

- 与 handoff 中“一个项目一个逻辑知识库”的验证结论一致。
- 项目级知识库更利于快速试点闭环。
- 后续如果权限隔离或召回干扰明显，再升级为项目共享依据库 + 队伍资料库。

### 4. 检索与命中验收只作为支持证据

决策：MaxKB retrieval-check 或检索命中只保存 safe snippet、locator、score、provider refs、related evidence/master-data ids；正式判断仍由平台 basis、master data、evidence、human decisions 决定。

原因：

- 避免外部知识库成为事实源。
- 满足审查平台对可追溯、可复核和人工确认的要求。
- 与现有 opening-condition preflight 设计一致。

## Risks / Trade-offs

- [风险] MaxKB API 真实路径可能与当前本地部署或版本不同。  
  [缓解] 提供 `MAXKB_HEALTH_PATH`、`MAXKB_KNOWLEDGE_PATH`、`MAXKB_DOCUMENT_PATH`、`MAXKB_RETRIEVAL_PATH` 可配置路径，默认只依赖 readiness。

- [风险] 过早接 MaxKB 检索会让业务误以为可以自动审批。  
  [缓解] 文档和 spec 明确 retrieval hit 只能作为支持证据，不写正式结论。

- [风险] 项目级知识库未来可能出现多队伍互相干扰。  
  [缓解] 当前 refs 预留 organization、contractPackage、subcontractTeam metadata；后续可升级粒度，不改平台事实模型。

## Migration Plan

1. 增加 MaxKB provider config/readiness/provider refs。
2. 更新外部 provider 文档和 preflight handoff 的平台侧对接说明。
3. 增加 focused tests，证明 MaxKB 配置摘要和 provider refs 不泄露密钥。
4. 同步主 specs/docs 并归档 change。

## Open Questions

- MaxKB 真实文档上传与 retrieval API 的精确路径、请求体和响应体应由外部 Worker/MaxKB 团队在联调时确认。本轮以可配置路径和安全归一化适配，避免硬编码不可验证细节。
