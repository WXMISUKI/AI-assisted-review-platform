# Change: opening-condition-agent-console-history-preview-report-hardening

## Why

开工条件平台最近一轮智能体工作台改造已经把默认入口收束到单项目审核台，但真实试用又暴露出三个直接影响投产的问题：

- 历史审核记录的删除入口被回归性隐藏，用户无法自助清理误建或测试 run。
- 旧资料包清单中的 PDF/文件条目没有独立对象时，预览区只抛英文技术提示，用户无法判断这是旧数据限制还是平台故障。
- 智能体处理进度最终没有直接输出可交付的 Markdown 报告，而是把用户赶去一个密度过高的报告详情页，违背了“像 AI 回复一样在主流程里交付结果”的目标。

这三个问题都不属于局部美化，而是当前 MVP 审核闭环的关键可用性缺口。

## What Changes

- 恢复开工条件智能体历史任务列表中的删除入口，并保持删除后的列表与选中态立即同步。
- 为旧资料包/清单条目补充可解释的预览降级：明确说明该条目是否缺少独立预览对象，并在可行时回退到原始资料包打开路径。
- 将右侧智能体进度面板中的最终报告改为主展示面，直接按平台生成的 Markdown 报告结构化渲染。
- 让报告 Markdown 更贴近当前平台要求的“施工条件核查报告”交付格式，并优先使用项目/核查对象的人类可读字段。

## Non-Goals

- 不引入新的第三方 Markdown 编辑器或完整富文本系统。
- 不重写整个报告归档页信息架构。
- 不对旧资料包数据做离线迁移或批量补历史对象。

## Impact

- Frontend: `src/productWorkspacePages.tsx`, `src/styles/opening-condition.css`, `src/App.tsx`
- Backend/domain: `server/openingConditionPilotStore.mjs`
- Verification: `server/openingConditionPilotUiBoundarySmoke.test.mjs`

## Guardrails

- 删除能力仍以平台后端任务接口为准，前端只做列表同步与安全降级。
- 旧资料包缺少独立预览对象时，必须明确提示“旧数据/清单限制”，不能伪装成预览成功。
- 报告 Markdown 仍由平台任务事实生成，前端只负责渲染，不在 UI 侧杜撰核查结论。
