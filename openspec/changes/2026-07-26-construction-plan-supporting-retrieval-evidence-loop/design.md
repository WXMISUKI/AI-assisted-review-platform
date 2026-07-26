## Context

仓库里已有知识库 provider 适配层：

- `server/knowledgeBaseProvider.mjs`
- `GET /api/knowledge-base/provider/status`
- `searchKnowledgeBase(input)`

并且现有 provider contract 已经明确：

- retrieval hit 只能返回 safe snippet、locator、score、provider refs
- provider 不能成为正式事实源
- 平台 owns review records and conclusions

施工方案工作台里也已有 issue 依据展示位置，但还没有 issue 级 supporting retrieval evidence 闭环。

## Goals / Non-Goals

**Goals**

- 为单条 issue 提供按需 supporting evidence 查询能力
- 复用现有 provider adapter，不新建第二套知识库调用链
- 只返回 safe hits，不暴露 prompts、provider traces、raw payload
- 在工作台中给审查人员一个低干扰、可折叠的证据视图

**Non-Goals**

- 不做完整知识库管理页改版
- 不做 issue 证据结果持久化入库
- 不把 retrieval hit 直接写回正式 issue 结论
- 不引入 reranker、多轮检索、embedding 管理、租户权限重构

## Decisions

1. 采用“按需查询”而不是“issue 生成时预取并持久化”
   - 理由：MVP 更快，避免给任务模型再增加一层易失状态与同步复杂度。

2. supporting evidence 接口保持 task/issue scoped
   - 路径建议：`GET /api/review-tasks/:taskId/issues/:issueId/supporting-evidence`
   - 理由：调用方无需理解 provider 细节，只围绕当前审查 issue 工作。

3. query 由平台后端组装
   - 输入源：
     - `issue.finding.title`
     - `issue.finding.reason`
     - `issue.finding.basis`
     - `issue.anchor.text`
     - primary basis reference
     - paragraph / section context
   - 理由：避免前端自行拼 query，确保 provider 输入边界统一、可控、可迭代。

4. provider 不可用时返回安全降级结果
   - 理由：支持证据是增强层，不应该阻塞 workbench 的核心 issue 决策。

## API Shape

Response:

- `ok`
- `status`
- `taskId`
- `issueId`
- `query`
- `provider`
- `hits`
- `message`

`hits` 仅允许包含：

- `provider`
- `providerDatasetId`
- `knowledgeId`
- `providerDocumentId`
- `providerChunkId`
- `title`
- `safeSnippet`
- `locator`
- `score`
- `sourceObjectId`
- `masterDataIds`
- `evidenceIds`

## UI Behavior

- issue 卡片新增“支持证据”折叠区
- 用户首次展开时才请求接口
- 成功时展示 hit 列表
- 空结果时展示“未召回支持证据”
- provider 不可用或调用失败时展示安全降级提示
- 不改变 accept / reject / edit / complete 原有流程

## Risks / Trade-offs

- [Risk] query 组织不够理想，召回质量一般
  - Mitigation: 先保证闭环通路和安全边界，后续再调 query 组装策略。

- [Risk] 前端对每条 issue 都立即请求会造成噪音
  - Mitigation: 改为按需展开加载，并缓存当前 issue 的查询结果。

- [Risk] 用户误把 retrieval hit 当正式依据
  - Mitigation: UI 文案明确标识为“支持证据”，不替代正式依据与人工结论。
