# 外部 Provider 接入边界

本项目采用“平台拥有事实与状态，外部 provider 提供能力”的集成方式。外部 provider 可以承担 OCR、LLM、对象存储、知识召回、异步 worker 等能力，但不能直接成为判定依据、项目主数据、人工决策、审查结论或报告资产的事实源。

## 推荐优先级

### 近期优先准备

1. **RAGFlow / RAG 知识库 provider**
   - 用途：资料模板、历史证据、人工修正、chunk 召回和引用辅助。
   - 不做：正式事实源、任务状态机、自动通过结论。
   - 平台保存：workspace、组织、合同包、分包队伍、知识库状态、provider dataset/document/chunk refs、同步状态。
   - 参考：RAGFlow 官方 HTTP API 文档覆盖 dataset、document、chunk 与 retrieval 能力，见 [RAGFlow HTTP API Reference](https://ragflow.io/docs/http_api_reference)。

2. **Agent Worker provider**
   - 用途：资料包解压、长时间 OCR、复杂文档解析、后续可恢复智能体编排。
   - 当前状态：已有 `AGENT_SERVICE_BASE_URL` 与 readiness summary，未配置时使用本地 fallback。

3. **Queue provider**
   - 用途：任务增多后承载 OCR、RAG、LLM、报告生成等异步任务。
   - 当前状态：已有本地 worker queue 摘要；生产化时再切 Redis/BullMQ/Celery/RQ。

### 已有基础 provider

- LLM / NewAPI：`OPENAI_API_KEY`、`OPENAI_BASE_URL`、`OPENAI_MODEL`。
- PaddleOCR：`PADDLEOCR_TOKEN`、`PADDLEOCR_JOB_URL`、`PADDLEOCR_MODEL`。
- MinIO：`MINIO_ENDPOINT`、`MINIO_PUBLIC_ENDPOINT`、`MINIO_ACCESS_KEY`、`MINIO_SECRET_KEY`、`MINIO_BUCKET`、`MINIO_REGION`。

## RAGFlow 配置项

RAGFlow 默认是可选 provider。没有配置时，平台健康检查不会因此失败。

```env
RAGFLOW_ENABLED=true
RAGFLOW_BASE_URL=http://127.0.0.1:9380
RAGFLOW_API_KEY=your-server-side-api-key
RAGFLOW_DEFAULT_DATASET_ID=optional-dataset-id
RAGFLOW_TIMEOUT_MS=5000
```

如果你的 RAGFlow 部署 API 路径与默认值不同，可以显式覆盖：

```env
RAGFLOW_HEALTH_PATH=/api/v1/health
RAGFLOW_DATASET_PATH=/api/v1/datasets
RAGFLOW_DOCUMENT_PATH=/api/v1/datasets/:datasetId/documents
RAGFLOW_CHUNK_PATH=/api/v1/documents/:documentId/chunks
RAGFLOW_RETRIEVAL_PATH=/api/v1/retrieval
```

这些路径只在服务端使用，前端不会接触 API key、Authorization header、raw text、provider trace 或私有 URL。

## 平台记录与外部索引的关系

```text
Platform source of truth
  ├─ basis version
  ├─ project master data
  ├─ evidence records
  ├─ human decisions
  ├─ check item results
  └─ report assets

External provider support
  └─ RAGFlow dataset/document/chunk refs
       ├─ safe snippet
       ├─ locator
       ├─ score
       └─ related evidence/master-data ids
```

当 RAGFlow 召回结果与平台已发布依据或主数据冲突时，平台保留冲突并以平台事实为准。冲突项应进入人工复核或证据解释，不应自动覆盖结论。

## 调试入口

- `/api/health`：返回核心 provider、知识库 provider、Agent Service、Queue 等安全摘要。
- `/api/knowledge-base/provider/status`：返回当前知识库 provider readiness。

## 下一步建议

1. 先用 RAGFlow 建一个项目/合同包/分包队伍级 dataset。
2. 把合同边界、核查表模板、历史人工修正、已确认主数据摘要作为首批索引资料。
3. 平台侧只保存 dataset/document/chunk refs 和 safe snippet。
4. 正式核查时只把 RAGFlow 作为召回辅助，仍以平台 basis/master-data/evidence/human-decision 为准。
