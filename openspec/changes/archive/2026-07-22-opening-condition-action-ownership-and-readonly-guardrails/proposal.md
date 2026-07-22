## Why

前一轮已经完成了“状态归一 + 单入口整改复审引导”，但真实试点离“稳定驱动作业流”还差一层关键能力：操作者仍然无法在页面上一眼看出当前该谁处理、下一步动作是什么、是否已经超期，以及 archived 轮次下哪些动作必须彻底只读。要让平台从“能跑通试点”走向“能真正组织复审作业”，这层责任与动作语义必须尽快补上。

## What Changes

- 收口 archived 轮次在资料接入页的只读一致性，确保执行台、发布门禁和知识库动作全部禁用。
- 为开工条件试点新增“责任人 / 下一动作 / 到期状态”派生语义，用于表达当前 run 的作业归属和推进方向。
- 在执行台、人工复核、报告归档和历史轮次详情中统一展示操作者可理解的动作引导，而不是只暴露底层状态枚举。
- 先以试点规则派生方式实现时限与超期提示，不引入新的后端持久化模型。

## Capabilities

### New Capabilities
- `opening-condition-action-ownership`: 定义开工条件试点 run 的当前责任人、下一动作、时限状态与归档后动作边界。

### Modified Capabilities
- `opening-condition-pilot-execution-console`: 增加 archived 只读一致性与执行台动作归属展示。
- `opening-condition-human-review-delivery-hardening`: 将人工复核页的阻塞处理改为明确的责任移交与下一动作提示。
- `opening-condition-report-findings-delivery`: 在报告页补充本轮责任人、下一动作、时限状态与整改移交摘要。
- `opening-condition-rectification-rerun-history`: 在历史轮次详情中保留每轮的动作归属快照，帮助判断当前轮与历史轮的责任边界。

## Impact

- `src/productWorkspacePages.tsx`：新增 run 级动作归属派生、只读禁用收口、报告/复核/历史页动作卡片。
- `src/App.tsx`：如有必要补充当前 run 的动作模式透传。
- `src/styles.css`：补充责任人、下一动作、时限状态相关的轻量样式。
- OpenSpec 主规格：沉淀“责任人与下一动作驱动”这一阶段性方向，避免继续停留在状态枚举层。
