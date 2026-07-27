## Context

当前开工条件平台已经具备 platform-owned 的 pilot task、packet、checklistDefinition、checkItems、humanReviewQueue、reportAsset 等核心事实模型，也已经具备两项早期能力：

1. 上传核查表后，后端可以尝试直接从文档内容提取 checklistDefinition。
2. 上传资料包 ZIP 后，后端可以提取 bounded manifest，形成 `inventoryEntries`。

但这两项能力都还停留在“能跑通最小路径”的阶段：

- `inventoryEntries` 只有清单事实，没有逐文件对象，因此前端无法为大多数资料包文件提供稳定预览，也无法把同一个条目复用于后续 OCR/知识库/人工复核。
- checklistDefinition 虽然支持从上传文档提取，但仍混合着静态模板兜底语义，没有被完全提升为正式主路径，导致平台容易退回“按文件名猜模板”的旧思路。

这轮变更只做开工条件平台，不触碰施工方案审查平台。目标是把 Dify 工作流里最有价值的前两段沉淀为平台内置编排基础：资料包逐文件资产化、上传核查表动态提取 check_items。

## Goals / Non-Goals

**Goals:**

- 让 ZIP 资料包在平台内拆分出逐文件资产，并为每个条目保留稳定对象引用与来源映射。
- 让后续资料文档库、待核查项、人工复核、证据匹配优先依赖逐文件资产，而不是回退整个压缩包。
- 明确 checklistDefinition 的正式来源优先级：显式输入 > 上传核查表内容解析 > 受控模板兜底 > 既有任务定义。
- 保持当前 MVP 只处理“资料核查”范围，继续排除“现场核查”行。
- 保持平台后端拥有事实源；Dify 继续只作为 schema 与提示词参考，不重新成为运行时强依赖。

**Non-Goals:**

- 本轮不引入完整 OCR 批处理、知识库自动入库或 provider-side 异步 worker 编排。
- 本轮不重写人工复核、报告归档、整改复审状态机，只为它们补稳定输入。
- 本轮不做多租户、权限、数据库迁移或施工方案平台共享抽象重构。

## Decisions

### 1. 资料包子文件以“平台对象镜像”形式落地，而不是只保存 manifest 行

决定：当资料包 ZIP 可被平台读取时，平台在 intake/init 阶段提取每个受支持子文件，并为其创建独立对象记录；`inventoryEntry` 额外保留 `derivedObjectRef` 或等价字段，指向该独立对象。

原因：

- 前端预览、待核查项详情、人工复核都需要稳定文件对象，而不是只知道“它曾经在某个 ZIP 里”。
- 后续 OCR/知识库编排必须以可复用的单文件对象为输入，否则每轮都要重新下载并拆整个 ZIP。
- 平台保留来源 ZIP 条目关系后，仍然能回溯原始资料包，不会丢失审计链。

备选方案：

- 只保留 manifest，不落逐文件对象：实现最轻，但无法解决预览与复用问题。
- 把解包与逐文件对象化完全交给 Dify/provider：会把平台事实边界重新推回外部系统，不符合当前产品方向。

### 2. 逐文件资产只处理 bounded 支持类型，其他条目继续保留清单事实

决定：优先镜像 `pdf/doc/docx/png/jpg/jpeg/webp/gif/bmp` 等当前业务需要的文件类型；目录、超大文件、未知类型、危险扩展名继续保留清单事实，并返回安全 fallback reason。

原因：

- 这样可以快速支持平台预览和材料核查主路径，不被少数边缘文件拖住。
- 维持 bounded 存储成本与实现复杂度，避免本轮直接变成通用解压缩文件管理系统。

备选方案：

- 解压并保存所有文件：覆盖最全，但安全与成本边界过大。
- 完全不保存子文件，只在预览时临时解压：重复计算重、状态不可追踪，也不利于后续 OCR。

### 3. checklistDefinition 的主路径切换为“上传核查表内容解析”

决定：只要上传核查表对象可读取，就优先调用 `extractOpeningConditionChecklistDefinitionFromDocxBuffer` 或其等价解析路径；只有当内容解析失败、产物为空，且文件名命中已知模板时，才走静态模板兜底。

原因：

- 用户明确要求不能把承台 22 项写死，必须跟随上传的核查表变化。
- 这与 Dify 工作流里的“审查表格 json 输出”阶段一致，能让平台自己的 `check_items` 成为正式事实源。
- 模板仍保留为受控 fallback，保证老样本或解析失败场景下不至于全链路阻断。

备选方案：

- 永远优先模板：稳定但无法泛化，不符合投产目标。
- 完全移除模板：风险过高，真实联调时一旦解析失败就没有安全兜底。

### 4. 动态提取后的 checklist facts 与 Dify schema 对齐，但不直接持久化 Dify 原始输出

决定：平台继续使用现有 checklistDefinition/checkItems 领域模型持久化结果，但字段语义对齐 Dify 的 `check_items`：item id、category、sub-category、content、mandatory、as-needed、expected material names、row index 等。

原因：

- 保持平台事实模型稳定，避免在后端直接引入 Dify 专属 payload。
- 又能确保后续人工复核和报告生成沿用你已经验证过的工作流 schema。

备选方案：

- 直接存完整 Dify JSON：耦合外部工作流，不利于平台演进。
- 完全不参考 Dify schema：容易再次偏离你已经沉淀的业务结构。

## Risks / Trade-offs

- ZIP 子文件镜像会增加对象存储数量 → 通过文件类型白名单、数量上限和安全摘要约束控制成本。
- intake/init 时做解压与子文件上传会增加初始化耗时 → 先限定在单项目试点规模，后续再拆后台 worker。
- checklist 文档内容解析仍可能受到扫描件、格式异常影响 → 保留模板兜底和 `manual_definition_required` 诊断，不伪造结果。
- packet 结构新增对象映射字段会影响前端读取逻辑 → 通过任务归一化和 smoke 测试保证兼容旧数据。

## Migration Plan

1. 扩展 packet/inventory 数据结构，允许 inventory entry 关联逐文件对象引用与来源 ZIP 元数据。
2. 在 intake/init 时为新上传资料包生成逐文件对象；旧任务保持原状，通过 fallback message 明确说明。
3. 将前端资料文档库和待核查详情的预览优先切到逐文件对象。
4. 将 checklistDefinition 解析优先级切到上传文档内容，并保留模板 fallback。
5. 补充 domain/HTTP/UI smoke，覆盖新任务路径与旧任务降级路径。

回滚策略：

- 若逐文件镜像逻辑出现问题，可回退到旧的 manifest-only 行为；旧数据模型仍兼容。
- checklist 提取主路径若不稳定，可临时恢复模板优先级，但保留当前新增字段不破坏存量任务。

## Open Questions

- 本轮逐文件镜像的单个 ZIP 文件数量和总大小上限是否需要继续收紧到比当前 manifest 上限更小。
- 是否需要在本轮就为逐文件对象记录更明确的 mime/category 分类，还是先使用文件扩展名与 contentType 即可。
