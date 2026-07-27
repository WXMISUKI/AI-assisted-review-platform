## Why

当前开工条件平台虽然已经具备任务、清单、人工复核和报告这些后端事实源，但资料包仍停留在 ZIP manifest 级别，缺少逐文件资产化能力；同时核查项提取虽然支持上传核查表解析，却还没有作为平台主路径完全取代静态模板兜底。结果是资料预览、待核查项证据定位、人工复核上下文和最终报告输入都不稳定，平台没有真正学到并内化现有 Dify 工作流里最有价值的编排环节。

## What Changes

- 让开工条件资料包在平台内完成逐文件资产化，而不是只保留 ZIP manifest 条目。
- 为每个资料包子文件记录稳定的平台对象引用、来源 ZIP 条目关系、文件摘要和可预览元数据。
- 让资料文档库、待核查项详情和后续人工复核优先消费逐文件资产，而不是退回整个压缩包。
- 将“上传核查表内容解析得到 checklist/check_items”提升为平台主路径，优先于静态模板匹配。
- 继续保持当前 MVP 只处理“资料核查”范围；上传核查表中属于“现场核查”的行继续排除，不进入当前材料核查闭环。
- 保留静态模板兜底，但只在上传核查表无法解析且文件名命中受控模板时才使用。

## Capabilities

### New Capabilities

- `opening-condition-packet-item-assets`: 定义开工条件资料包逐文件资产化、条目与对象映射、预览与后续编排复用的正式平台能力。

### Modified Capabilities

- `maxkb-material-packet-coordination`: 从“平台拥有 manifest”扩展到“平台拥有逐文件资产和对象映射”，为后续 OCR/知识库编排提供稳定输入。
- `opening-condition-pilot-checklist-definition`: 将上传核查表解析提升为 checklist definition 的首选正式来源，并明确静态模板仅作为受控兜底。
- `opening-condition-platform-orchestrated-agent-run`: 将平台编排输入从 manifest 级材料升级为逐文件资产，并要求自动审查阶段优先使用动态提取出的 checklist/check_items。

## Impact

- 后端：`server/openingConditionZipManifest.mjs`、`server/openingConditionPilotStore.mjs`、`server/openingConditionChecklistAdapter.mjs`、对象存储读写与任务归一化逻辑。
- 前端：`src/productWorkspacePages.tsx` 中资料文档库、待核查项详情、人工复核预览来源的读取逻辑。
- 状态与契约：pilot task packet 结构、inventory entry 结构、逐文件对象与来源映射、checklistDefinition 提取诊断。
- 验证：opening-condition HTTP/UI smoke 需要覆盖逐文件资产化与动态核查项提取路径。
