## 1. 规格与对接边界

- [x] 1.1 编写 MaxKB provider 接入 proposal、design 与 delta specs。
- [x] 1.2 沉淀平台与 MaxKB/OCR Worker 的职责边界、metadata、状态流、provider refs 和安全约束文档。

## 2. 后端 Provider 契约

- [x] 2.1 扩展知识库 provider 配置，支持 `KNOWLEDGE_PROVIDER=maxkb|ragflow|mock` 与 `MAXKB_*` 安全摘要。
- [x] 2.2 扩展 knowledge-base provider adapter，支持 MaxKB readiness 与基础 dataset/document/retrieval refs 归一化。
- [x] 2.3 扩展 provider ref 归一化，支持 MaxKB `knowledgeId`、documentId、chunkId、syncStatus。
- [x] 2.4 补充 focused tests，覆盖 MaxKB readiness、配置缺失降级和敏感字段过滤。

## 3. 前端契约与文档

- [x] 3.1 同步前端 typed contract，使 provider refs 和 readiness 能表达 MaxKB。
- [x] 3.2 更新外部 provider、开工条件 workflow、handoff 和架构决策文档。

## 4. 验证与归档

- [x] 4.1 运行最小 typecheck、provider tests 和相关 `node --check`。
- [x] 4.2 同步主 specs/docs，并归档本次 change。
