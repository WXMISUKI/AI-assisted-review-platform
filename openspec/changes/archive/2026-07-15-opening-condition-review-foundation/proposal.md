## Why

开工条件核查是施工方案核查平台近期最适合参赛和快速投产的业务切片：它复用现有文档接入、OCR、AI 审查、人工决策和报告资产底座，但比完整施工方案审查更容易形成“资料初始化、规则比对、人工复核、辅助报告”的闭环。

现有 Dify 工作流已经能解压资料、OCR、解析核查表并生成报告，但企业级落地不能停留在一次性 prompt 流程；需要把判定依据、项目人员设备证照主数据、规则核查结果、证据和人工复核状态沉淀为平台能力。

## What Changes

- 新增“开工条件核查”产品与架构定位，明确其服务施工单位自查、监理审核，输出内部辅助意见，不替代人工责任。
- 新增开工条件核查领域能力，覆盖判定依据确认、项目主数据初始化、资料核查、规则/语义混合判断、Dify 人工复核和报告归档。
- 在平台中增加可展示的开工条件核查参赛入口，展示依据确认、主数据、核查项、证据、复核建议和报告摘要。
- 记录 Dify 工作流桥接边界：Dify 负责编排、OCR/LLM 节点和 Human Input；平台负责主数据、规则结果、证据、安全摘要和审计契约。
- 不引入生产数据库迁移；本切片先以 TypeScript 领域模型和 mock 数据表达未来后端契约。

## Capabilities

### New Capabilities

- `opening-condition-review`: 开工条件资料审查的领域能力，包含依据版本、项目主数据、资料核查项、规则结论、证据链、人工复核触发和报告摘要。

### Modified Capabilities

- `platform-shell`: 增加开工条件核查作为平台参赛业务入口，不改变既有施工方案审查工作台行为。
- `agent-asset-management`: 增加开工条件核查智能体/Dify 工作流桥接的资产展示，不改变既有智能体配置契约。

## Impact

- Affected docs: `docs/product-requirements.md`, `docs/platform-architecture.md`, `docs/architecture-evolution-decisions.md`.
- Affected frontend: `src/appShellTypes.ts`, `src/appShellDisplay.tsx`, `src/appShellPages.tsx`, `src/App.tsx`, `src/styles.css`.
- Affected domain: new `src/domain/openingConditionReview.ts`.
- No new runtime dependency, no backend API change, no database migration in this foundation slice.
