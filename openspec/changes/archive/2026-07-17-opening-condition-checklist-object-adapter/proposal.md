## Why

开工条件试点现在虽然已经有了领域 `intake/init` 入口和 task-bound checklist definition，但 intake 仍主要依赖前端把 mock `checkItems` 直接拼成 `checklistItems` 送入后端。这会让真实试点仍然受制于前端演示数据，无法把“核查表对象引用 -> 任务内可执行 checklist definition”真正收回到平台领域边界内。

这一轮应优先补上一个受控的 checklist-object adapter，让后端先基于已识别的核查表对象模板稳定生成 checklist definition。这样能最快把单项目试点从“前端喂数”推进到“后端拥有执行输入”，同时避免过早陷入重型 DOCX/XLSX 解析。

## What Changes

- 为开工条件试点增加受控的 checklist-object adapter，由后端根据核查表对象安全引用识别模板并生成标准化 checklist definition。
- 让 intake/init 在未显式传入 `checklistItems` 时，优先尝试从 `checklistObject` 派生 checklist definition，并把派生结果持久化到 pilot task。
- 为 intake/init 返回补充安全的 checklist adapter 诊断，说明当前是显式输入、模板派生、复用既有定义，还是未识别需人工补录。
- 收紧前端 intake 调用，优先走后端 checklist-object adapter，而不是继续把演示态 checklist 明细作为主要执行输入每次传入。

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `opening-condition-pilot-workflow`: 增加“核查表对象受控适配”为正式核查前的任务输入来源之一，并要求未识别模板时返回安全阻塞信息。
- `opening-condition-pilot-intake-orchestration`: intake/init 在未传 `checklistItems` 时，需要根据 `checklistObject` 派生 checklist definition 并回传适配诊断。
- `opening-condition-pilot-checklist-definition`: checklist definition 的来源从“仅显式传入或历史已存”扩展为“显式传入 / checklist object 受控派生 / 既有任务复用”。
- `opening-condition-pilot-operational-api`: 前端 intake/init 合同需要支持展示 checklist adapter 的安全诊断，并允许以后端模板派生为默认路径。

## Impact

- 影响后端 pilot store 的 intake/init 编排、checklist definition 归一化与诊断返回。
- 影响开工条件门户前端 intake 调用方式和状态提示，但不新增上传通道、不改正式匹配 API 路径。
- 不引入新的外部 provider、数据库或环境变量配置。
