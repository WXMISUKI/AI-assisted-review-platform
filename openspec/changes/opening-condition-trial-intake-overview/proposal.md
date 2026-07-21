## Why

当前真实试点已经可以重复创建新 run、进入正式核查并处理归档任务，但资料接入后的“我这次到底识别并绑定了什么”仍然不够清楚。操作员虽然能继续往下跑链路，却很难在进入正式核查前快速核对：

- 当前 run 绑定了哪一版依据
- 当前工作区有哪些已发布或人工批准的主数据被纳入本次试点
- 当前知识库绑定和 provider 状态是什么
- checklist 适配、ZIP manifest 提取和下一步动作分别是什么

这会直接影响试点投产信心，也不利于你后续判断“要不要把 trial bootstrap 升级为正式的人工确认发布流程”。

## What Changes

- 在资料接入页新增“试点接入总览”面板，优先展示当前 run 的后端事实：
  - 当前 task/run id 与状态
  - 绑定依据版本
  - required master data
  - 知识库与 provider readiness
  - checklist 适配结果、manifest 条数、阻塞原因与 next action
- 真实试点 bootstrap 在未显式指定知识库时，优先复用当前工作区唯一可正式核查的 ready 知识库，避免新 run 被 provisional 占位知识库错误阻塞。
- 资料接入重新初始化 (`intake-init`) 也遵循同一套知识库选择策略，避免已有 run 因为历史 provisional 绑定而反复自锁。
- 前端“重新初始化资料包接入”对真实试点 run 只允许复用已持久化的真实对象引用，不再用 demo packet 覆盖真实上传 run；若真实对象引用已丢失，则明确提示操作员重新上传创建新 run。
- 将“依据与主数据”页改为优先展示后端真实记录，而不是只看 mock packet。
- 在总览中突出“当前 run 绑定”“已发布/人工批准”“试点占位数据”这些业务边界，帮助操作员在正式核查前做人类 sanity check。

## Capabilities

### New Capabilities
- `opening-condition-trial-intake-overview`: 定义真实试点资料接入后的后端事实总览与当前 run 核对能力。

### Modified Capabilities
- `opening-condition-single-project-trial-intake`: 资料接入页在上传与初始化后，应展示 task-owned intake overview，而不只是上传结果提示。
- `opening-condition-pilot-execution-console`: 当前 run 的资料接入总览应展示依据、主数据、知识库和 checklist/manifest 诊断。

## Impact

- `src/App.tsx`：补充工作区级 basis/master-data/knowledge-base 的同步状态。
- `src/productWorkspacePages.tsx`：新增试点接入总览面板，并让依据与主数据页优先展示后端记录。
- `src/domain/backendConnectivity.ts`：复用现有读取接口，无需新增服务边界。
- 不在本变更中重写 basis/master-data 发布状态机，不新增完整“确认后正式入库”流程。
