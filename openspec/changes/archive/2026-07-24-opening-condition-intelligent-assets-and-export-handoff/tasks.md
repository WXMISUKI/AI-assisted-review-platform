## 1. Spec and domain contract

- [x] 1.1 补齐 `opening-condition-intelligent-assets-and-export-handoff` 的 proposal、design、spec delta，并通过 OpenSpec 校验
- [x] 1.2 为开工条件报告包补充 export-handoff 领域模型与 safe summary contract
- [x] 1.3 为开工条件智能资产目录补充专用问题审查、法规整改、原表回填/导出适配器条目与绑定字段

## 2. Backend and registry implementation

- [x] 2.1 在 `server/openingConditionPilotStore.mjs` 中生成 exporter-ready handoff 摘要，绑定 findings package、模板和适配状态
- [x] 2.2 保持 report package 兼容旧字段，并为后续真实 docx/html adapter 调用保留稳定挂点

## 3. Frontend delivery and asset visibility

- [x] 3.1 在数据资产页展示开工条件专用智能资产与导出适配器目录
- [x] 3.2 在报告页展示 export handoff 状态、模板绑定和下一动作
- [x] 3.3 完成轻量 typecheck / spec 校验，并同步文档说明这是“先固化挂点，再接真实接口”的阶段
