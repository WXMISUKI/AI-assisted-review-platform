# 平台架构与开发方案

## 1. 总体架构

建议采用前后端分离架构：

- Frontend: React + TypeScript + Vite。
- Backend API: FastAPI 或 NestJS。
- Async Worker: Python Worker，负责文档解析、OCR、AI 审查、报告生成。
- Storage: PostgreSQL + MinIO/OSS。
- Cache/Queue: Redis + Celery/RQ/BullMQ。
- AI Orchestration: 初期可自研服务接口，后续接 Dify 或 LangGraph。
- Vector Store: 预留 Milvus、Qdrant、Chroma 或 pgvector。

存储职责建议明确分层：

- PostgreSQL 或等价关系型数据库作为结构化业务记录的目标事实源，承载用户、产品权限、项目、标段、机构、工作区、依据集、主数据、审查任务、核查项、人工决策和审计记录。
- MinIO/OSS 作为原始文件、OCR 产物、证据附件、报告文件和导出台账的对象存储。
- 向量库只承担语义检索和召回辅助，不作为合规事实、依据版本或人工决策的事实源。
- SQLite 仅用于本地原型、测试或轻量开发快照，不作为生产持久化方案。

## 2. 前端模块划分

```text
src/
  app/
    routes/
    layouts/
    providers/
  features/
    auth/
    documents/
    review-workbench/
    knowledge-base/
    data-assets/
    agents/
    prompt-assets/
    reports/
  shared/
    components/
    hooks/
    types/
    utils/
```

## 3. 页面路由建议

```text
/login
/products
/construction-plan/documents
/construction-plan/documents/:documentId
/construction-plan/knowledge-base
/construction-plan/data-assets/agents
/construction-plan/data-assets/prompts
/construction-plan/reports/:reportId
/opening-condition/workspaces
/opening-condition/workspaces/:workspaceId/basis
/opening-condition/workspaces/:workspaceId/master-data
/opening-condition/workspaces/:workspaceId/check-tasks
/opening-condition/workspaces/:workspaceId/human-review
/opening-condition/workspaces/:workspaceId/reports
```

统一登录后进入产品启动器。施工方案审查和开工条件核查分别拥有独立路由命名空间、独立左侧导航和独立业务上下文；二者复用统一身份、对象存储、OCR、智能体网关、SSE/任务状态和安全诊断能力。

## 4. 核心实体

### User

- id
- username
- displayName
- role: `super_admin | supervisor | contractor`
- organizationId

### Document

- id
- name
- projectName
- fileType
- fileUrl
- uploaderId
- status
- reviewMode
- createdAt
- updatedAt

### ReviewTask

- id
- documentId
- status
- progress
- currentStage
- startedAt
- finishedAt
- errorMessage

### ReviewIssue

沿用当前 Demo 模型，并扩展：

- id
- documentId
- source
- status
- severity
- anchor
- finding
- resolution
- confidence
- references

### Agent

- id
- name
- type
- promptId
- enabled
- roleScope
- createdAt

### PromptAsset

- id
- name
- type
- systemPrompt
- userTemplate
- outputSchema
- variables
- version
- enabled

### Report

- id
- documentId
- taskId
- reportType
- content
- fileUrl
- createdAt

### ProductPortal

- id: `construction-plan-review | opening-condition-review`
- name
- routeNamespace
- enabled
- roleScope

### OpeningConditionWorkspace

- id
- tenantId
- projectId
- contractPackageId
- participatingOrganizationId
- purpose
- roleContext
- activeBasisSetVersionId

### BasisSetVersion

- id
- workspaceId
- version
- status: `draft | pending_confirmation | published | superseded`
- components
- confirmedBy
- publishedAt

### ProjectMasterData

- id
- workspaceId
- type: `personnel | equipment | certificate | company | system_document`
- status: `provisional | confirmed | rejected | published`
- evidenceRefs
- validity
- confidence

## 5. 审查任务流

```mermaid
flowchart TD
  A["用户上传文档"] --> B["创建 Document 记录"]
  B --> C["用户点击开始审核"]
  C --> D["创建 ReviewTask"]
  D --> E["Worker 解析文档"]
  E --> F["施工方案审查智能体"]
  F --> G["结构化 ReviewIssue"]
  G --> H["前端流式展示进度/标注"]
  H --> I["用户接受/拒绝/人工标注"]
  I --> J{"所有问题处理完成?"}
  J -- 否 --> I
  J -- 是 --> K["提交/结束审核"]
  K --> L{"当前模式"}
  L -- 审查模式 --> M["审核报告生成智能体"]
  L -- 审查修改模式 --> N["生成修改后方案快照"]
  M --> O["报告归档"]
  N --> O
```

## 6. 异步与流式策略

推荐：

- 上传完成后创建任务。
- 前端进入详情页 loading 状态。
- 后端使用 SSE 推送阶段进度。
- 任务完成前禁止人工操作。
- 用户退出页面，任务继续执行。
- 用户再次进入文档详情页时恢复任务状态。

事件示例：

```json
{
  "taskId": "task-001",
  "type": "review.issue.created",
  "progress": 72,
  "payload": {
    "issueId": "ISSUE-001"
  }
}
```

## 7. 智能体接入策略

### 初期

- 使用本地 mock service。
- 前端保留智能体配置 UI。
- 输出使用固定 JSON。

### 中期

- 接入 Dify Workflow 或自研 FastAPI agent service。
- 知识库上下文通过 API 注入。
- 结构化输出落库。

### 后期

- 对复杂 human-in-the-loop 流程接入 LangGraph。
- 审查任务、人工决策、报告生成形成可恢复状态图。

### 开工条件核查工作流桥接

开工条件核查短期采用“独立业务门户 + 平台内可控工作流 + 组织/分包队伍知识库 + 外部能力适配器”的架构：

- Node BFF/平台领域层负责产品权限、工作区上下文、判定依据版本、项目主数据、核查项结果、证据链、安全摘要、人工复核和活动记录。
- OCR、LLM 或其他外部编排能力只作为可替换适配器，为资料包解压、OCR/LLM 抽取、核查表解析或报告草稿提供辅助输出；Dify 主要作为既有流程参考，不作为主维护路径。
- 外部输出必须先归一化为平台拥有的依据、主数据、证据、核查项、人工决策和报告记录，不能直接作为事实源或最终结论展示。
- 组织/分包队伍知识库沉淀已确认合同边界、资料模板、项目主数据、历史证据、人工修正和可引用资料片段；向量索引只能做召回辅助，不能代替结构化事实。
- RAGFlow 等外部知识库 provider 通过统一 provider 契约接入，配置与安全边界见 [external-provider-integration.md](./external-provider-integration.md)。
- 前端开工条件门户负责展示工作区选择、依据确认、主数据初始化、规则/语义结果、待复核队列和辅助报告。
- 后续数据库落地时，应把 basis_version、project_master_data、subcontract_knowledge_base、opening_condition_packet、check_item_result、evidence、human_review_decision 作为独立持久化对象。

这个边界避免外部工作流成为事实数据库，同时让平台可以逐步自研更可控的资料核查流程。

## 8. 技术选型建议

### 文档渲染

- PDF: PDF.js + react-pdf-highlighter 系列。
- DOCX: OnlyOffice 或后端转 PDF/HTML 后审阅。
- MVP: 继续 HTML mock。

### 文档解析

- MinerU：适合复杂 PDF、表格、版式。
- PyMuPDF/pdfplumber：适合坐标提取和轻量解析。
- PaddleOCR：扫描件/图片 OCR。

### 报告生成

- 初期：HTML/Markdown 报告预览。
- 中期：后端生成 PDF/Word。
- 台账：Excel 导出。

## 9. 权限策略

权限不只控制菜单，还要控制模式：

| 角色 | 文档库 | 审查模式 | 审查修改模式 | 报告生成 | 数据资产 |
|---|---|---|---|---|---|
| 超管 | 是 | 是 | 是 | 是 | 是 |
| 监理 | 是 | 是 | 否 | 是 | 否 |
| 施工方 | 是 | 否 | 是 | 否 | 否 |

## 10. 开发规范

项目级开发标准请统一参考 [development-standards.md](./development-standards.md)。后续所有前后端实现、接口调整、状态机变化、主题系统改动和安全约束更新，都应先对齐该文档，再进入具体实现。

## 11. 下一阶段推荐任务组

### Task Group A: App Shell

- 登录页。
- 角色 mock。
- 左侧导航。
- 文档库默认页。
- 知识库占位页。
- 数据资产占位页。

### Task Group B: Document Library

- 文档列表。
- 上传/拖拽区。
- 审查状态。
- 点击进入详情页。

### Task Group C: Agent Assets

- 智能体列表。
- 智能体详情。
- 提示词资产列表。
- 提示词编辑表单。

### Task Group D: Review Task Mock

- 上传后创建任务。
- 详情页 loading。
- mock 流式进度。
- 完成后进入当前审查工作台。

### Task Group E: Report Mock

- 所有问题处理后启用提交。
- 审查模式生成 mock 报告。
- 审查修改模式生成修改后方案快照。

### Task Group F: Product Portal Boundary

- 产品启动器。
- 施工方案审查独立门户。
- 开工条件核查独立门户。
- 产品权限和业务上下文隔离。

### Task Group G: Opening Condition Review

- 开工条件核查工作区选择。
- 判定依据确认状态。
- 人员、设备、证照、制度资料主数据初始化状态。
- 组织/分包队伍专属知识库状态。
- 资料核查项规则结果、语义说明和证据链。
- 平台人工复核队列。
- 内部辅助报告摘要。
