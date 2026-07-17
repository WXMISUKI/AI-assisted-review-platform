## Why

当前开工条件试点虽然已经把资料包对象引用正式接入任务，也把 checklist definition 收回到了后端，但 formal match 仍主要基于 `sourceObjects` 的粗粒度文件名和摘要做匹配。平台还没有真正拥有“资料包清单”这层领域事实，因此无法区分“压缩包对象本身”与“压缩包内实际文件条目”，也难以为后续 OCR、人工复核和报告提供稳定的证据入口。

下一阶段最值得优先推进的方向，是先把资料包清单做成平台自己的 packet inventory manifest。这样能最快把试点从“对象引用已接入”推进到“资料内容已被平台掌握”，同时为后续 ZIP 解包、OCR 批处理和知识库召回留出稳定契约。

## What Changes

- 为 opening-condition pilot packet 增加后端持久化的 inventory manifest 字段，记录资料包内的文件条目安全摘要。
- 让 `intake/init` 和 `packet` 接口支持显式传入 inventory entries；若未传入，则从现有 `sourceObjects` 受控派生默认 inventory。
- 让 formal match 优先基于 packet inventory entries 做确定性匹配，而不是只看粗粒度 `sourceObjects`。
- 为 intake/packet 事件和前端 typed contract 返回 inventory 解析诊断，说明当前是显式清单还是由 `sourceObjects` 默认派生。

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `opening-condition-pilot-workflow`: packet 上传后除对象引用外，还需要持有任务级 packet inventory manifest，formal match 优先使用该清单。
- `opening-condition-pilot-intake-orchestration`: intake/init 需要解析并返回 packet inventory 的来源与数量诊断。
- `opening-condition-pilot-operational-api`: 前后端 contract 需要支持 inventory entries 传输与诊断。
- `opening-condition-evidence-grounded-material-review`: 资料核查证据匹配应优先基于 packet inventory entry，而不是仅基于资料包对象名。

## Impact

- 影响 opening-condition pilot 的 packet 数据模型、intake/init 编排、formal match 候选匹配逻辑与定向测试。
- 不引入新的外部 provider、数据库或环境变量；仍在当前 file-backed development adapter 范围内完成。
- 为后续 ZIP 清单提取、OCR 批处理和知识库召回保留统一接入点，但本轮不实现这些重能力。
