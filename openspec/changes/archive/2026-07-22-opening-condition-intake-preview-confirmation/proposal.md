## Why

当前开工条件试点已经能把资料上传成 basis records 和 master-data records，也能继续走发布治理与正式核查，但操作者仍然缺少“正式入库前的识别预览确认”这一层。上传后系统到底识别成了哪些依据候选、哪些主数据候选、哪些仍是低置信或待确认状态，页面还没有用清晰的 operator-facing 方式先讲明白。

如果不先补这层，平台就仍然容易停留在“能跑通一轮”，而不是“能让监理放心反复使用”。从快速投产角度看，下一阶段最有价值的切片不是继续扩权限或数据库，而是把“识别结果预览 -> 人工确认 -> 正式入库/发布”这条入口链路做扎实。

## What Changes

- 在资料接入页增加“识别预览确认工作台”，让操作者在正式发布前先查看 basis 和 master-data 的当前识别结果。
- 将 basis / master-data 候选记录按“待人工确认 / 待发布 / 已可用于当前 run”组织为预览视图，而不是只在后续治理页中查看。
- 在预览工作台明确说明“确认主数据”“发布依据”这些动作本质上是在把当前识别结果正式纳入平台可用资产。
- 保持本轮为前端与现有后端字段复用，不新增新的解析 API、数据库模型或逐条编辑流程。

## Capabilities

### New Capabilities
- `opening-condition-intake-candidate-preview`: 定义资料接入阶段的识别结果预览与确认视图，使操作者在正式入库前能审视 basis 与 master-data 候选。

### Modified Capabilities
- `opening-condition-intake-preview-and-publish-gate`: 预览门禁不仅显示是否 ready，还要展示正式入库前的识别结果预览和对应确认动作。
- `opening-condition-publication-governance`: 发布治理面需要与资料接入页的候选预览形成连续语义，避免一个页面讲“候选”，另一个页面讲“目录”时口径脱节。

## Impact

- `src/productWorkspacePages.tsx`：在资料接入页增加识别预览确认工作台，并与现有门禁动作衔接。
- `src/styles/opening-condition.css`：补充识别预览工作台样式。
- `openspec/specs/*`：同步资料接入预览与发布治理的连续行为要求。
