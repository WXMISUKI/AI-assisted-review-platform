## Why

当前开工条件试点虽然已经把 packet inventory 作为任务内事实保存下来了，但这份清单大多仍来自前端显式输入或 `sourceObjects` 的粗粒度默认派生，还没有真正掌握 ZIP 资料包内部的实际文件条目。下一步最值得优先推进的，就是把“资料包对象已接入”继续推进到“ZIP 内部真实清单已被平台掌握”，这样才能为后续正式资料匹配、人工复核定位和 OCR 批处理建立可靠入口。

## What Changes

- 为 opening-condition pilot intake / packet 流程增加 ZIP manifest 提取能力：当资料对象是 ZIP 且具备可读取的存储 key 时，后端从对象存储读取并解析压缩包条目。
- 将提取出的真实 ZIP 条目写入 `packet.inventoryEntries`，并在 intake diagnostics / packet event 中返回安全的清单来源与回退摘要。
- 当 ZIP manifest 无法提取或对象并非 ZIP 时，保持当前受控回退：继续由 `sourceObjects` 默认派生 inventory。
- 为 MinIO provider 增加受控对象读取能力，并为 ZIP manifest 解析增加 focused tests。
- **BREAKING** 无。

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `opening-condition-pilot-workflow`: packet inventory 需要支持从真实 ZIP 对象提取文件条目，并在失败时安全回退。
- `opening-condition-pilot-intake-orchestration`: intake/init 需要解析 ZIP manifest，并返回更细的 inventory resolution / fallback diagnostics。
- `opening-condition-pilot-operational-api`: 前后端 contract 需要支持 ZIP manifest 解析结果与安全诊断字段。
- `opening-condition-evidence-grounded-material-review`: formal match 需要消费 ZIP manifest 生成的 inventory entries，而不是只依赖粗粒度对象名。

## Impact

- 影响 `server/minioClient.mjs`、opening-condition pilot store、相关测试、typed domain contract、主 specs/docs。
- 需要新增一个服务端 ZIP 解析依赖，用于只读遍历 ZIP 中央目录，不做解压落盘。
- 不引入新的环境变量、不改上传通道、不接入 OCR/RAGFlow，也不改变当前 file-backed development adapter 的总体边界。
