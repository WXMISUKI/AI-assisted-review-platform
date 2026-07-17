## Why

当前开工条件核查已经具备独立门户、试点任务、依据版本、项目主数据、证据化核查和报告归档雏形。下一阶段最能推进投产的方向不是继续深挖 Dify 或局部优化证据字段，而是把正式核查前的两个强制前置阶段产品化：判定依据确认、项目主数据初始化，并建立组织/分包队伍专属知识库来复用资料核验经验。

该方向可以最快形成真实试点闭环：用户先确认合同边界和依据版本，再确认人员、设备、证照、单位和制度资料，随后正式核查表和资料包只做可追溯比对，而不是每次上传都让智能体从零理解。

## What Changes

- 将“判定依据确认”和“项目主数据初始化”定义为正式资料核查前的强制 Preflight Gate。
- 新增组织/分包队伍专属知识库能力，沉淀已确认资料模板、历史证据、人工修正记录、资料片段和主数据引用。
- 明确 Dify 不进入主维护路径；Dify 既有流程可作为历史参考或后续可选适配器，但平台内工作流和平台记录是事实源。
- 在试点任务流中增加 readiness summary，阻止未完成前置门禁的任务进入正式资料核查。
- 将下一阶段任务拆分为：前置门禁模型、知识库记录模型、主数据发布与引用、正式核查准入、页面展示和验证。

## Capabilities

### New Capabilities

- `opening-condition-preflight-knowledge-base`: 开工条件核查前置门禁与组织/分包队伍知识库能力，覆盖依据确认、主数据初始化、知识库沉淀、正式核查准入和试点 readiness 展示。

### Modified Capabilities

- `opening-condition-pilot-workflow`: 正式核查任务必须通过前置门禁，且工作区应绑定组织/分包队伍知识库后再进入资料包核查。
- `opening-condition-evidence-grounded-material-review`: 证据化资料核查应优先使用前置阶段发布的依据、主数据和知识库引用，而不是直接从资料包临时推断事实。

## Impact

- Affected docs: `CONTEXT.md`, `docs/product-requirements.md`, `docs/platform-architecture.md`, `docs/opening-condition-pilot-workflow.md`, `docs/adr/`.
- Affected specs: new `opening-condition-preflight-knowledge-base`, plus deltas for pilot workflow and evidence-grounded material review.
- Likely implementation areas for the next apply phase: `server/openingConditionPilotStore.mjs`, `src/domain/openingConditionPilot.ts`, `src/domain/openingConditionReview.ts`, opening-condition portal pages, and focused backend tests.
- No Dify implementation is planned for this change.
