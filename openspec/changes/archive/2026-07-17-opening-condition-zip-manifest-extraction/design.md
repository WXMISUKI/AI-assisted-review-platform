## Context

当前 opening-condition pilot 已经完成两层关键收口：

- `intake/init` 已成为领域编排入口；
- `packet.inventoryEntries` 已成为 formal match 的优先候选来源。

但 inventory 仍主要来自两种来源：

1. 请求显式传入 `inventoryEntries`
2. 由 `sourceObjects` 默认派生

这意味着当用户实际上传的是 `资料包.zip` 时，平台目前仍只能看到“这个 ZIP 对象存在”，看不到 ZIP 内部真实文件条目。对于我们当前试点最关心的“资料是否齐全”判断，这会直接限制资料匹配粒度，也会让人工复核、报告证据定位和后续 OCR 批处理缺少统一入口。

## Goals / Non-Goals

**Goals:**

- 从 MinIO 中读取 ZIP 对象并提取 bounded manifest entries。
- 让 intake/init 和 packet intake 自动优先使用 ZIP manifest 作为 packet inventory 的来源之一。
- 在不改变现有 packet / matching 主结构的前提下，把 inventory 来源升级为真实条目。
- 提供安全、可诊断的 resolution / fallback 信息，便于前端显示和排查。

**Non-Goals:**

- 不做 ZIP 文件解压落盘。
- 不做 ZIP 内文件 OCR、全文抽取或内容分类。
- 不做多层嵌套压缩包递归处理。
- 不新增后台任务队列、数据库迁移或新的外部 provider。

## Decisions

### 1. ZIP manifest 继续归一到既有 `packet.inventoryEntries`

决策：不新增独立的 `zipManifest` 字段，而是把 ZIP 条目解析结果继续写入既有 `packet.inventoryEntries`。

原因：

- 上一轮已经把 inventory 定义成 formal match 的优先候选事实源；
- 前端、事件、报告和人工复核都已经围绕 inventory 建立了消费路径；
- 本轮只升级来源，不重做数据模型，可以把风险压到最小。

备选方案：

- 单独新增 `zipManifestEntries`：会造成双清单并存，匹配和展示都要分叉。

### 2. inventory 来源增加第三条：`derived_from_zip_manifest`

决策：inventory 解析优先级调整为：

1. 显式 `inventoryEntries`
2. 可读取 ZIP 对象提取 manifest
3. 由 `sourceObjects` 默认派生

原因：

- 显式输入仍是最可控的覆盖手段；
- 真实 ZIP manifest 是本轮最有价值的自动化来源；
- 默认派生保留为安全回退，避免因为 ZIP 解析失败把流程直接打断。

### 3. ZIP 解析采用服务端只读中央目录遍历

决策：新增一个轻量 ZIP 解析依赖，仅遍历 ZIP 条目元数据，不读取条目正文，也不在磁盘展开文件。

原因：

- 我们当前只需要文件级 manifest，而不是内容抽取；
- 只读中央目录的资源占用和风险都更低；
- 更适合服务端同步 intake 路径。

备选方案：

- 调系统解压工具：运行时和部署环境耦合更强，不适合作为后端正式能力。
- 直接引入完整 OCR/解压流水线：价值过重，会把本轮边界打散。

### 4. 提取结果必须有边界并保留安全回退诊断

决策：ZIP manifest 提取只生成 bounded entries：

- `id`
- `sourceObjectId`
- `fileName`
- `relativePath`
- `sizeBytes`
- `summary`

同时 diagnostics 只返回：

- `inventoryResolution`
- `inventoryEntryCount`
- `inventoryFallbackReason`
- `inventorySourceObjectId`
- `inventoryFileNames` 样本

原因：

- 符合当前项目对 provider / event 的安全摘要策略；
- 够前端和测试消费；
- 不泄露原始对象字节、私有 URL 或全文内容。

## Risks / Trade-offs

- [风险] ZIP 依赖新增会带来少量供应链面。  
  [缓解] 选择稳定、范围小、只做目录遍历的依赖；不引入 native build。

- [风险] intake/init 现在是同步路径，读取大 ZIP 可能拖慢请求。  
  [缓解] 本轮只提取条目元数据，并设置条目数量边界；后续若需要再迁移到异步 extracting worker。

- [风险] 某些 ZIP 条目文件名编码或目录结构不规范，可能导致个别条目无法很好归一。  
  [缓解] 保守清洗路径并在失败时整体回退到 `sourceObjects` 默认 inventory，不阻断任务初始化。

- [风险] 当前 evidence 仍回指 source object，而不是 ZIP 内部独立对象。  
  [缓解] 这是有意保留的兼容层；本轮先解决“看见条目”，后续再考虑“条目级独立证据对象”。

## Migration Plan

1. 增加 MinIO 对象读取 helper 和 ZIP manifest extractor。
2. 在 intake/init 与 packet intake 中接入 ZIP inventory 解析。
3. 扩展 typed contract 和 diagnostics 枚举。
4. 跑最小 typecheck 与 pilot store focused tests。
5. 同步主 specs/docs 并归档 change。

回退策略：

- 若 ZIP 解析逻辑异常，仍可通过默认 `sourceObjects` inventory 完成 intake，不会破坏既有试点流程。

## Open Questions

- 暂无阻塞性开放问题。本轮不需要新增配置；唯一新增的是 ZIP 解析 npm 依赖。
