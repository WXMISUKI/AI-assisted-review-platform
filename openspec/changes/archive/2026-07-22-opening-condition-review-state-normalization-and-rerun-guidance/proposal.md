## Why

当前真实试点已经具备多轮 run、人工复核、整改闭环和下一轮复审能力，但操作者仍会遇到两个关键问题：同一核查项同时出现“待人工判断”和“人工驳回”这类冲突状态，以及“发起下一轮整改复审”和资料接入页重新上传之间的重复入口。要让平台快速走向试点投产，必须先把状态语义和作业入口收口成一套稳定、可理解的操作流。

## What Changes

- 为开工条件试点定义统一的最终交付状态语义，收敛 `checkItems`、`humanReviewQueue`、报告展示三套状态来源。
- 调整报告页、整改闭环页和人工复核相关展示，优先显示最终状态而不是底层内部枚举。
- 为“开始下一轮整改复审”建立唯一主入口，并让资料接入页改为承接该入口的复审接入页。
- 为 archived run、current run、history run 明确交互边界，减少重复入口和误操作。

## Capabilities

### New Capabilities
- `opening-condition-review-state-normalization`: 定义开工条件核查项从原始判定、人工复核到最终交付状态的归一规则。

### Modified Capabilities
- `opening-condition-report-findings-delivery`: 报告页需要按最终交付状态展示问题项，而不是直接展示底层 verdict。
- `opening-condition-pilot-execution-console`: 复审入口需要收口为唯一主入口，并明确 archived/current/history run 的动作边界。
- `opening-condition-rectification-rerun-history`: 历史详情与整改闭环对照需使用统一状态语义，避免同一项出现冲突展示。

## Impact

- `src/productWorkspacePages.tsx`：增加最终状态解析、调整报告/整改闭环展示和复审入口引导。
- `src/App.tsx`：维护复审入口意图状态，控制资料接入页是否处于“下一轮整改复审”模式。
- `src/styles.css`：补充少量状态标签和接入引导样式。
- 主规格与调研文档：沉淀“流程产品化优先，智能资产化并行规划”的后续方向。
