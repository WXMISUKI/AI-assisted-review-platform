## Context

开工条件平台已经具备真实试点任务、资料上传、核查、人工复核、报告生成和归档接口，但前端入口仍沿用工作区治理台账的组织方式。`src/productWorkspacePages.tsx` 中的智能体区域已经存在，但任务详情默认展开、上传仍复用旧资料接入面板，且 `src/domain/openingConditionReview.ts` 中的静态 G15 packet 会在真实任务不存在时提供历史核查项、证据和报告。

本 change 只处理开工条件平台的 MVP 入口和演示数据边界。施工审查平台、后端试点状态机、Dify/MaxKB/OCR 适配器、真实对象上传和既有归档能力不在本 change 内重构。

## Goals / Non-Goals

**Goals:**

- 默认页面只突出当前项目、`新建审核`、历史审核记录和空状态。
- 让用户按三类资料完成一次自然的任务创建动作。
- 将任务详情改为显式进入的左右分栏工作区。
- 清除前端默认静态历史结果，避免真实任务为空时显示 G15 示例结论。
- 将资料合规性选择作为任务创建的明确输入，并保持审查结果由后端/工作流事实驱动。
- 让 UI smoke 可以验证“没有历史脏数据时仍然可用”。

**Non-Goals:**

- 本轮不实现真实 PDF/DOCX 阅读器。
- 本轮不新增数据库表或完整多项目组织管理。
- 本轮不实现流式工作流事件；进度继续从后端任务状态派生。
- 本轮不编写或修改 Dify 工作流提示词，不在前端复制合规审查规则。
- 本轮不删除施工审查侧的 mock、fixture 或历史页面。

## Decisions

1. **保留领域类型，重建干净默认 packet。**
   - `OpeningConditionReviewPacket`、标签函数和页面所需的派生函数继续保留，避免牵连既有治理页和类型契约。
   - 默认 `openingConditionWorkspaces` 只保留一个可切换的当前项目上下文，默认 packet 的 `basisVersions`、`evidence`、`masterData`、`humanReviewQueue`、`checkItems` 和报告内容为空或中性文案。
   - 真实任务存在时，页面优先使用后端任务事实；默认 packet 只负责没有任务时的项目上下文和空态。

2. **以页面状态区分首页和详情，而不是新增后端路由。**
   - `OpeningConditionWorkspaceShell` 继续作为入口编排。
   - 首页只渲染智能体新建审核入口和紧凑历史列表。
   - 点击任务后在同一前端路由上下文中设置选中任务，渲染任务详情；返回动作回到首页。
   - 现有高级治理能力保留为详情内的二级入口，不继续作为一级左侧菜单。

3. **复用真实上传和 bootstrap，只扩展审查范围字段。**
   - 三行上传弹窗仍调用既有 `uploadMinioDocument` 和 `bootstrapOpeningConditionPilotTrial`。
   - `reviewScope` 采用稳定的 `"completeness" | "completeness_and_compliance"` 枚举，资料完整性始终包含。
   - 服务端先安全接收并持久化/回显该字段；若当前状态机还未执行深审，任务只能展示“已请求合规审查，等待后端结果”，不得由前端生成 findings。

4. **用源绑定的文件摘要作为 MVP 预览。**
   - 文件列表只来自任务的 `basisVersion.sourceObject`、`packet.checklistObject`、`packet.sourceObjects` 和 `inventoryEntries`。
   - 没有任务时不显示文件、核查项、证据或报告。
   - 真实 PDF/DOCX 阅读器作为后续独立 change，避免本轮扩大范围。

5. **以既有 smoke 为护栏，新增结构断言。**
   - UI smoke 断言左侧低噪音导航、空历史态、详情显式进入、三资料门禁、合规字段和无 G15 静态报告。
   - 服务端 smoke 保持现有真实 bootstrap 契约测试，并增加 reviewScope 的透传/安全存储断言。

## Risks / Trade-offs

- [旧治理页依赖默认 packet 的非空示例数据] → 保留类型和页面入口，但改为显式空态；若治理页需要演示数据，改由后端真实任务或独立测试 fixture 提供。
- [前后端暂时不同步 reviewScope] → 先在前端 client、服务端 normalize 和 task safe summary 中建立同一枚举；未执行深审时只显示请求状态，不伪造结果。
- [详情显式进入后用户可能找不到高级能力] → 在详情页提供清晰的高级台账入口和返回首页按钮，不把治理菜单重新放回首屏。
- [清理静态数据误伤并行开发] → 只改 `openingConditionReview.ts`、开工条件页面和开工条件 smoke；不改 `src/domain/mockReview.ts` 等施工审查文件。

## Migration Plan

1. 先更新本 change 的 delta spec 和任务清单。
2. 清理开工条件前端 fixture，并让 App 初始状态只依赖干净项目上下文和后端任务列表。
3. 重构开工条件 shell 和智能体页的导航、首页、详情、上传弹窗。
4. 扩展 bootstrap 输入的 `reviewScope`，同步服务端安全归一化。
5. 运行 `openspec validate ... --strict`、`npm run typecheck`、`npm run smoke:opening-condition:ui` 和相关后端 smoke。
6. 若验证通过，使用 OpenSpec archive 归档；若失败，保留 change 以便继续修复。

## Open Questions

- 真实 PDF/DOCX 预览器属于后续 change，本轮只验证对象摘要是否正确展示。
- 后端深度合规子智能体的具体工作流节点由后续 provider/工作流 change 定义，本轮只固定 intake contract 和事实来源边界。
