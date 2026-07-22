## Why

当前资料接入页已经能展示识别预览，也能通过批量按钮发布依据、确认主数据，但操作者仍然缺少逐条处理候选记录的能力。现实试点里，真正决定是否可投产的不是“能否一次性批量通过”，而是当某条人员、设备、制度或证照候选存在问题时，监理能不能逐条确认、驳回，并留下安全备注。

从快速投产角度看，下一阶段最值得推进的不是继续扩报告样式，也不是提前做更重的平台化，而是把“候选识别 -> 逐条确认/驳回 -> 记录备注 -> 正式入库”做成闭环。这样平台才真正具备资产确认能力，而不仅是候选展示能力。

## What Changes

- 在资料接入页的识别预览确认工作台中，为 basis 和 master-data 候选补充逐条确认动作。
- 允许操作者为当前 basis 候选添加入库备注后再发布。
- 允许操作者对当前 run 的 master-data 候选逐条执行通过或驳回，并记录安全备注。
- 保留现有批量确认按钮，作为快速路径；逐条确认作为更精细的投产操作面。

## Capabilities

### New Capabilities
- `opening-condition-intake-itemized-confirmation`: 定义资料接入阶段对 basis 和 master-data 候选的逐条确认、驳回与备注留痕行为。

### Modified Capabilities
- `opening-condition-intake-candidate-preview`: 候选预览不再只展示识别结果，还要支持逐条确认动作与备注输入。
- `opening-condition-master-data`: 主数据确认流程需要支持逐条 approve / reject 的 operator-facing 入口。
- `opening-condition-basis-workflow`: 当前 run 的 basis 候选在发布前需要支持补充安全备注与逐条确认语义。

## Impact

- `src/App.tsx`：增加 basis 候选逐条发布和 master-data 候选逐条确认/驳回处理函数。
- `src/productWorkspacePages.tsx`：在资料接入页候选预览区增加逐条动作与备注输入。
- `src/styles/opening-condition.css`：补充候选确认表单与动作区样式。
- `openspec/specs/*`：同步逐条确认与备注留痕行为。
