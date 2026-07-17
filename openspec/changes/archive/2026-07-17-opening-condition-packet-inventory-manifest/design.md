## Context

当前 packet 侧已经具备：

- `checklistObject`
- `sourceObjects`
- `packet_uploaded` 事件
- 基于 checklist definition 的 deterministic match

但 packet 仍缺少一层更接近真实业务的“资料包条目清单”：

- `sourceObjects` 更像上传对象引用，不一定等于资料包内部实际文件；
- 压缩包对象与压缩包内文件目前没有稳定区分；
- formal match 对“资料包里到底有哪些文件”缺少 task-owned 事实层。

这会让后续 ZIP 解包、OCR 批处理、人工跳转和报告证据定位都缺少稳定边界。

## Goals / Non-Goals

**Goals:**

- 为 pilot packet 增加 task-owned inventory manifest。
- 让 inventory 成为 formal match 的优先候选来源。
- 保持显式传入与默认派生两条路径并存，方便平滑接入后续真实解包能力。
- 返回安全、可显示的 inventory 解析诊断。

**Non-Goals:**

- 不实现真实 ZIP 解压或压缩包遍历。
- 不实现 OCR 批处理或内容抽取。
- 不增加新的 provider 配置。
- 不重做前端上传通道。

## Decisions

### 1. inventory manifest 作为 packet 的任务内事实

决策：在 `packet` 上新增 `inventoryEntries[]`，而不是把这层事实挂在 task 根节点或单独建子表。

原因：

- inventory 与 packet 上传批次天然绑定；
- 便于 packet 重传或重初始化时整体替换；
- 与后续 `packet_uploaded`、`extracting`、`matching` 状态衔接自然。

### 2. inventory 来源采用双路径

决策：

1. 若请求显式传入 `inventoryEntries`，优先使用；
2. 否则从 `sourceObjects` 受控派生默认 inventory，每个 sourceObject 生成一个 bounded entry。

原因：

- 允许以后直接接 ZIP manifest extractor；
- 当前无需等待新 provider 或解包能力就能先落地契约；
- 与 checklist adapter 的演进方式一致。

### 3. formal match 优先匹配 inventory entry

决策：matching 阶段改为优先遍历 `packet.inventoryEntries` 作为候选；若某条目绑定了 `sourceObjectId`，证据仍回指该 source object，但使用 entry 的文件名/摘要作为命中依据。

原因：

- 让匹配粒度逐步从“对象”过渡到“资料条目”；
- 保留与现有 evidence objectRef 的兼容性；
- 后续即使 source object 是 ZIP，仍能在条目级别形成 evidence。

### 4. 诊断只返回安全摘要

决策：intake/init 与 packet event 仅返回：

- inventoryResolution
- inventoryEntryCount
- 前若干 entry 文件名

不返回私有 URL、压缩包内部全文或原始 traces。

原因：

- 保持与当前 provider diagnostics 的安全边界一致；
- 给操作员足够的“是否解析到清单”的可见性；
- 不提前扩大敏感数据面。

## Risks / Trade-offs

- [风险] 默认由 sourceObjects 派生的 inventory 仍然比较粗。  
  [缓解] 这轮目标是先固化 contract，后续 ZIP manifest extractor 只需喂同一个 inventory 接口。

- [风险] packet inventory 与 evidence objectRef 之间存在“一条目回指一个上传对象”的折中。  
  [缓解] 先在证据侧保留 sourceObject 兼容，等真实 ZIP 解包时再引入更细的 entry/object 关系。

- [风险] 前端当前 demo packet 本身就是伪清单，用户可能误解为已完成真实解包。  
  [缓解] 通过 diagnostics 明确区分 `direct_input` 与 `derived_from_source_objects`。
