## Why

真实样本试跑表明，开工条件平台的默认入口仍然像内部治理驾驶舱，历史任务、轮次、证据和资产状态会在用户首次进入时形成信息噪声。当前前端还保留 G15 示例 packet，导致没有真实任务时也会看到核查项、报告结论和人工复核数据，影响 MVP 试跑对真实交互的判断。

本变更将入口收敛为成熟审核产品式的“新建审核 -> 三类资料上传 -> 任务进度 -> 文件预览 -> 报告交付”主链路，并清除开工条件前端默认历史脏数据，使空工作区真正呈现空状态。

## What Changes

- 将开工条件左侧导航收敛为当前项目卡片、新建审核和当前项目下的历史审核记录。
- 将默认首页固定为 `开工条件核查智能体`，资料完整性必选、资料合规性可选。
- 将三类资料上传改造成三行清单式弹窗，只有合同/资质依据、资料核查表、核查资料包全部上传成功后才能开始解析。
- 将任务详情从默认首页移出，只有点击历史任务后才进入“左侧文件列表/预览、右侧智能体进度/报告”工作区。
- 清除开工条件前端静态 G15 历史任务、核查项、证据、人工复核和报告结论；保留干净的当前项目上下文和类型/派生函数。
- 后端任务为空时，首屏不得通过 fallback packet 渲染历史审核内容。
- 将资料合规性选择纳入试点任务创建输入；前端不得据此自行生成深度合规结论。
- 保留既有后端任务、人工复核、报告生成、归档和真实上传链路，不修改施工审查平台 mock。
- **BREAKING**：开工条件默认页面不再直接展示内部治理台账和静态示例报告，相关能力只从任务详情或高级入口进入。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `opening-condition-pilot-execution-console`: 修改开工条件默认信息架构、任务详情进入方式、三资料上传交互、空状态和审查范围任务契约。

## Impact

- 前端：`src/productWorkspacePages.tsx`、`src/App.tsx`、`src/appShellPages.tsx`、`src/domain/openingConditionReview.ts`、相关开工条件样式和 UI smoke。
- API 契约：`bootstrapOpeningConditionPilotTrial` 的任务 intake 输入增加审查范围字段，并由服务端安全持久化或忽略未支持字段时返回明确状态。
- 规格与指导：更新 `openspec/specs/opening-condition-pilot-execution-console/spec.md`，并新增本 change 的 delta spec。
- 不新增依赖，不删除施工审查侧 mock，不删除后端测试 fixture。
