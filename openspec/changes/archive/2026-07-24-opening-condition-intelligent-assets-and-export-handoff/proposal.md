## Why

开工条件试点已经具备问题分类和结构化报告交付包，但这些能力还没有进一步沉淀为平台可管理、可绑定、可复用的智能资产，也没有形成可供原表回填和文档导出器消费的稳定交付挂点。继续把智能体、提示词、模板和导出逻辑散落在页面或临时代码里，会很快拖慢后续子智能体扩展和外部接口接入。

现在最值得推进的是先把“十二类问题审查智能体 / 法规整改智能体 / 报告回填适配器”统一收编为平台资产，并把报告导出的 handoff contract 固化下来。这样后续无论是接你提供的 `docxToHtml` / `htmlToDocx` 接口，还是补真正的子智能体执行链，都能接在稳定边界上。

## What Changes

- 新增开工条件智能资产注册能力，统一表达问题类型审查智能体、法规整改智能体、报告回填/导出适配器及其绑定的提示词、模板和状态。
- 扩展 agent asset 目录，使平台能明确展示开工条件专属的智能资产清单，而不只保留一个笼统的开工条件核查智能体。
- 新增原表回填/导出 handoff contract，使结构化报告包能输出 exporter-ready 的输入摘要、模板绑定和适配状态。
- 扩展 Dify / 外部工作流边界说明，明确文档回填与导出属于可选 adapter，不拥有平台业务状态。
- 保留外部 `docxToHtml` / `htmlToDocx` 接口接入点，但本变更不直接调用真实接口。

## Capabilities

### New Capabilities
- `opening-condition-export-handoff`: 定义开工条件报告导出、原表回填和文档适配器可消费的稳定 handoff contract。

### Modified Capabilities
- `agent-asset-management`: 智能资产目录需要展示开工条件专属的问题审查、法规整改和文档回填适配器资产。
- `opening-condition-dify-bridge`: 需要明确 Dify / 外部适配器在原表回填和报告导出中的边界，以及平台如何持有规范化结果。
- `opening-condition-report-findings-delivery`: 报告交付包需要带出 exporter-ready 的 handoff 摘要和模板/适配状态。

## Impact

- 受影响代码：
  - `src/domain/agentAssets.ts`
  - `src/appShellPages.tsx`
  - `src/domain/openingConditionPilot.ts`
  - `server/openingConditionPilotStore.mjs`
  - 报告页/资产页相关展示模块
- 受影响系统：
  - 智能资产目录
  - 开工条件报告交付包
  - 未来原表回填、docx/html 导出适配器、法规整改智能体和问题复核智能体
- 不引入新的外部依赖；本轮先完成领域 contract 与平台展示。
