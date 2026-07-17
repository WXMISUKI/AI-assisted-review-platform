## Context

当前开工条件试点已经具备：

- 领域 `intake/init` 编排入口；
- task-bound checklist definition 持久化能力；
- 手动触发正式匹配的操作台。

但 checklist definition 的真正来源仍偏前端演示态：`src/App.tsx` 会从 mock packet 的 `checkItems` 组装 `checklistItems`，再在 intake/init 时传给后端。这意味着：

- backend 还没有真正拥有“核查表对象 -> 执行输入”的领域转换能力；
- 真实试点依旧绕不开前端私有适配逻辑；
- 后续即便接入 DOCX/XLSX 解析，也没有一个稳定、可控、可诊断的 adapter 边界。

## Goals / Non-Goals

**Goals:**

- 把 checklist definition 的默认来源收回到后端领域边界。
- 先支持受控模板识别，而不是直接上重型文档解析。
- 让 intake/init 能返回安全、可操作的 adapter 诊断。
- 保持 formal match 继续复用 task-bound checklist definition 的执行模型。

**Non-Goals:**

- 不做 DOCX/XLSX 二进制解析。
- 不做 OCR 抽取、版面恢复或 LLM 自动生成 checklist。
- 不新建上传通道，不改变对象存储契约。
- 不扩展到完整多项目、多租户权限体系。

## Decisions

### 1. 先做受控模板注册表，不做自由文档解析

决策：后端新增一个受控 checklist template registry，根据 `checklistObject.fileName`、`summary` 等有限字段识别已知模板，并产出标准化 checklist definition。

原因：

- 这是从演示态迈向真实试点的最短闭环；
- 模板注册表的输出契约，未来可以被 DOCX/XLSX parser、OCR 结果或人工录入复用；
- 避免在还没有稳定任务输入契约前就陷入复杂解析质量问题。

备选方案：

- 继续由前端发送 checklistItems：太依赖演示态，不利于后端拥有领域事实。
- 立即上 DOCX 解析：工作量大、风险高，不符合当前“最快投产”的方向。

### 2. intake/init 的 checklistDefinition 来源采用三层优先级

决策：

1. 若请求显式传入 `checklistItems`，优先使用；
2. 否则尝试从 `checklistObject` 通过受控 adapter 派生；
3. 若仍无法派生，则回退到现有 task 的 `checklistDefinition`。

原因：

- 保留向后兼容和人工兜底路径；
- 新老路径可以平滑切换；
- 允许未来重跑 intake/init 时复用既有任务定义。

### 3. adapter 失败不隐式伪造 checklist definition

决策：若请求未显式提供 checklist definition，且 checklist object 又无法识别模板，同时任务也没有既有定义，则 intake/init 仍可完成任务和 packet 绑定，但必须返回明确的安全诊断，formal match 继续在无 checklist definition 时阻止执行。

原因：

- 不把“无定义”伪装成“已准备就绪”；
- 保持现有 formal match 的门禁语义；
- 给运维/产品一个清晰的人工补录或补模板入口。

### 4. 当前试点只内置承台施工条件核查模板

决策：这一轮仅在后端注册当前单项目试点最常用的承台施工条件核查模板，覆盖人员、设备、审批签章、依据完整性和现场核查 out-of-scope 项。

原因：

- 与当前试点目标一致；
- 可以直接替换前端 demo checklist 输入；
- 避免把模板体系做成提前抽象过度。

## Risks / Trade-offs

- [风险] 模板识别依赖文件名/摘要关键词，短期可控但覆盖有限。  
  [缓解] 通过 adapter diagnostics 暴露“未识别模板”，后续逐步扩展注册表或接入真实 parser。

- [风险] 后端模板与前端展示 packet 的 mock checkItems 可能短期存在双份定义。  
  [缓解] 以后端 task.checklistDefinition 和 checkItems 作为执行真相；前端 mock 仅保留展示和回退用途。

- [风险] intake 成功但 checklist definition 为空时，操作员可能误以为可直接 formal match。  
  [缓解] intake 返回 checklist adapter 诊断，前端状态文案显式提示“需人工补录/补模板”。
