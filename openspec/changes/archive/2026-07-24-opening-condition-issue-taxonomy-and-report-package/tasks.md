## 1. Spec and model foundation

- [x] 1.1 补齐 `opening-condition-issue-taxonomy-and-report-package` 的 proposal、design、spec delta，并通过 OpenSpec 校验
- [x] 1.2 为开工条件试点补充问题分类领域模型与内置 taxonomy registry
- [x] 1.3 扩展试点 `checkItem`、报告诊断和相关 normalize 类型，支持问题类型、法规依据、整改要求、复核建议等字段

## 2. Backend report package implementation

- [x] 2.1 在 `server/openingConditionPilotStore.mjs` 中为匹配结果派生 issue taxonomy 字段，兼容现有 run 和历史 run
- [x] 2.2 扩展报告生成逻辑，产出结构化 findings package、分类汇总和交付建议
- [x] 2.3 保持旧摘要字段兼容，并补充轻量 smoke 或 typecheck 级验证

## 3. Frontend delivery consumption

- [x] 3.1 报告页优先消费结构化 findings package，改善问题清单的业务语义
- [x] 3.2 对缺失新字段的历史 run 保持回退展示，不破坏现有试点链路
- [x] 3.3 更新相关文档与后续待办，明确 docx/html 导出与智能资产接入为下一阶段
