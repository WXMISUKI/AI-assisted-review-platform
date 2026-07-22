## Why

平台已经具备同一工作区多轮核查、历史详情查看和归档后发起整改复审的能力，但报告仍只能粗略显示上一轮与当前轮的不通过数量。真实试点投产更需要回答“上一轮哪些问题已整改、哪些仍延续、哪些是本轮新增”，否则复审链路只能跑通，不能形成有说服力的问题闭环。

## What Changes

- 在报告归档页增加“整改闭环对照”视图，按核查项对比上一轮与当前轮的问题状态。
- 将对比结果分为已整改、仍未整改、本轮新增、仍待人工判断四类，便于监理快速判断补件效果。
- 在历史详情中展示当前选择轮次与上一归档轮次的差异摘要，而不是只展示数量。
- 在报告交付内容中补充面向下一轮的闭环建议，避免用户只看到静态问题清单。

## Capabilities

### New Capabilities
- `opening-condition-rectification-diff-closure`: 定义同一工作区相邻核查轮次之间的问题差异、整改闭环状态和复审交接摘要。

### Modified Capabilities
- `opening-condition-rectification-rerun-history`: 历史轮次详情需要支持与上一轮的整改差异对照。
- `opening-condition-report-findings-delivery`: 报告交付视图需要展示整改闭环摘要和分类后的问题延续状态。

## Impact

- `src/productWorkspacePages.tsx`：补充相邻 run 对比模型、整改闭环摘要卡和差异明细列表。
- `src/styles.css`：增加少量复用的闭环对照样式，保持当前工作台密度与可读性。
- OpenSpec 主规格：新增整改差异闭环能力，并扩展历史与报告交付规格。
