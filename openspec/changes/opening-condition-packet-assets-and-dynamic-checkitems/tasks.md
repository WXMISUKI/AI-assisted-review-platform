## 1. Packet file assets

- [x] 1.1 扩展 opening-condition packet / inventory 数据结构，允许 inventory entry 关联逐文件派生对象引用与安全 fallback reason。
- [x] 1.2 在 ZIP 资料包解析阶段提取受支持子文件并写入平台对象存储，同时保留来源 ZIP 条目映射。
- [x] 1.3 更新匹配候选与证据归一化逻辑，优先使用逐文件派生对象，兼容旧的 manifest-only 数据。

## 2. Dynamic checklist extraction

- [ ] 2.1 收敛 checklistDefinition 来源优先级为“显式输入 > 上传核查表解析 > 受控模板兜底 > 既有任务定义”。
- [ ] 2.2 强化上传核查表解析结果的规范化，只保留当前 MVP 的 `资料核查` 项并排除 `现场核查` 行。
- [ ] 2.3 将动态提取得到的 checklist facts 同步到任务诊断和自动编排输入，避免前端或模板重复猜测。

## 3. Review surface and verification

- [x] 3.1 更新资料文档库、待核查项详情和人工复核预览来源，优先展示逐文件派生对象并对旧数据保留降级提示。
- [ ] 3.2 补充 opening-condition domain / HTTP / UI smoke，覆盖逐文件资产化、动态 checklist 提取和旧任务兼容路径。
- [ ] 3.3 运行轻量验证并同步变更状态，整理本轮实现与后续 C/D 阶段的衔接说明。
