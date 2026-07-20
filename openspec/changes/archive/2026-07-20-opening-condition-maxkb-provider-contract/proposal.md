## Why

MaxKB 项目级知识库和 OCR Worker 已经在外部跑通本地闭环，但当前平台仍主要以 RAGFlow 命名来描述知识库 provider，缺少 MaxKB 作为外部知识库 provider 的正式契约、配置摘要和对接文档。下一步需要把 MaxKB 纳入平台的 provider 边界，让平台继续拥有业务事实与审查状态，同时把 MaxKB 作为检索副本和命中验收能力接入。

## What Changes

- 扩展外部知识库 provider 契约，支持 `maxkb` provider 名称、项目级知识库绑定、文档/命中引用和安全 readiness 摘要。
- 增加 MaxKB 服务端配置项与健康摘要，保持可选 provider：未配置时不阻塞现有试点流程。
- 让平台知识库记录可以保存 MaxKB `knowledgeId`、document refs、sync status 等安全 provider refs。
- 补充面向前置平台与 MaxKB/OCR Worker 团队的对接文档，明确 metadata、状态、幂等、审计和职责边界。
- **BREAKING** 无。

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `external-provider-integration-contracts`: 外部知识库 provider 契约从 RAGFlow 扩展到 MaxKB，要求安全 readiness、provider refs 和调用边界。
- `opening-condition-preflight-knowledge-base`: 开工条件知识库记录需要支持 MaxKB 项目级知识库绑定，并保持平台事实源边界。
- `backend-connectivity`: 后端健康摘要需要报告 MaxKB 或所选知识库 provider 的安全状态。

## Impact

- 影响 `server/config.mjs`、`server/knowledgeBaseProvider.mjs`、`server/providerContracts.mjs`、opening-condition pilot store 的 provider ref 归一化、前端 typed contract 和相关 docs/specs。
- 不新增浏览器可见密钥，不让 MaxKB 持有项目/队伍/审查任务事实。
- 不实现完整业务数据库迁移、不直接联动 OCR Worker 入库、不让检索命中自动生成正式审查结论。
