## Why

开工条件平台已经具备平台 own 的 issue taxonomy、structured findings package、delivery package 和 export handoff 基础结构，但“结构化报告包 -> DOCX 导出适配器”这段链路仍然偏松：

- 导出失败时的 API 语义还没有和现有报告导出通道完全对齐，调用方难以稳定判断是否应回退到 HTML/页面交付；
- 导出 HTML 虽然已有 delivery package row 回退逻辑，但缺少开工条件专属 smoke 去证明“导出内容优先消费持久化交付行，而不是重新解释原始 findings”；
- 真实接入 `html2docx` 适配器后，开工条件这条线仍缺少面向 API、适配器状态和回写 handoff 的定向验收护栏。

这一步值得现在做，因为它直接把“平台结构化问题交付包”推进到“可重复导出、可稳定失败、可回写留痕”的交付边界，比继续补局部 UI 更接近试点投产。

## What Changes

- 收口开工条件报告导出接口的失败语义，补齐 `fallback`、`adapterStatus` 和安全诊断返回。
- 固化导出 HTML 必须优先消费持久化 delivery package rows，保持导出器只读平台事实，不重新解释 provider/raw findings。
- 增加开工条件专属 DOCX export smoke，覆盖未生成报告、未配置适配器、适配器成功回写与 delivery package row 优先级。
- 按最小范围更新前端导出状态文案消费，使失败态与适配器状态更清楚。

## Capabilities

### Modified Capabilities
- `opening-condition-export-handoff`: 增强导出失败 fallback 语义与 adapter-safe handoff 验收。
- `http-tools-document-conversion-adapter`: 明确开工条件导出接口对 `html2docx` 失败/成功结果的 bounded mapping。

## Impact

- 受影响代码：
  - `server/index.mjs`
  - `server/openingConditionPilotStore.mjs`
  - `src/App.tsx`
  - 开工条件导出相关 smoke tests
- 不改变开工条件主状态机，不新增外部依赖，不扩散到施工审查平台。
