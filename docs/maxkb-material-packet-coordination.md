# MaxKB 资料包联调配合需求

更新时间：2026-07-20

## 定位

前置平台是开工条件核查的业务事实源，负责项目、机构、合同包、核查任务、资料包清单、人工复核和报告归档。MaxKB 通过 OCR Worker / MaxKB Provider Proxy 作为外部知识库检索能力接入，只提供 OCR 派生产物入库、召回和命中验收支撑。

## 当前已确认配置

前置平台调用 Worker/Proxy，不直连 MaxKB 容器，不保存 MaxKB 管理员账号密码。平台侧只需要：

```env
KNOWLEDGE_PROVIDER=maxkb
MAXKB_ENABLED=true
MAXKB_BASE_URL=http://192.168.0.235:8091
MAXKB_API_KEY=<PREFLIGHT_API_KEY>
MAXKB_DEFAULT_KNOWLEDGE_ID=019f787c-644e-7162-bfe5-f4ee02a91539
MAXKB_TIMEOUT_MS=5000
MAXKB_HEALTH_PATH=/api/health
MAXKB_STATUS_PATH=/api/knowledge-base/provider/status
MAXKB_RETRIEVAL_PATH=/api/knowledge/:knowledgeId/search
```

## ZIP 和混合文件职责边界

前置平台负责：

- 接收合同/依据、资料核查表、资料包 ZIP 的对象引用。
- 对 ZIP 提取有界 manifest，记录文件名、相对路径、大小、扩展名、初判类型和所属资料分类。
- 根据项目、参与机构、合同包、核查表条目判断文件是否纳入本次核查范围。
- 对低置信分类、无法识别的签章/签名/勾选项、疑似错项目/错主体资料生成待人工复核项。
- 保存 `sourceObjectId`、`contentHash`、`reviewTaskId`、`basisVersionId`、`masterDataIds`、`humanDecision` 等平台事实。

OCR Worker / MaxKB Provider Proxy 负责：

- 按平台传入的对象引用和 metadata 拉取或接收可访问文件。
- 对 PDF、Office、图片等进行 OCR/版面后处理，生成安全 Markdown/JSON/CSV 摘要。
- 将 OCR 派生产物写入 MaxKB，并返回安全的 `knowledgeId/documentId/chunkId` 引用。
- 提供按核查项的检索或 retrieval-check，返回命中片段、定位、分数和安全诊断。
- 使用幂等键和 correlation id 避免重复处理，并支持链路追踪。

MaxKB 负责：

- 保存知识库、文档分段、向量索引和检索结果。
- 不负责项目、队伍、核查任务、最终结论、人工复核或报告归档。

## 建议给 MaxKB 项目补充的接口

### 1. 批量资料入库

```http
POST /api/knowledge/{knowledgeId}/material-packets/ingest
Authorization: Bearer <PREFLIGHT_API_KEY>
Idempotency-Key: ingest:<workspaceId>:<taskId>:<packetHash>
X-Correlation-ID: <platform-correlation-id>
```

请求要点：

- `workspaceId`、`projectId`、`contractPackageId`、`participatingOrganizationId`
- `reviewTaskId`、`basisVersionId`、`subcontractTeamId`
- `files[]`: `sourceObjectId`、`storageKey/url`、`fileName`、`relativePath`、`contentType`、`sizeBytes`、`documentTypeHint`、`fileTypeRouteHint`、`checkItemIds`

返回要点：

- `ok`、`status`
- `files[]`: `sourceObjectId`、`status`、`providerDocumentId`、`chunkCount`、`safeSummary`、`diagnostics`
- `status` 建议覆盖：`queued`、`ocr_processing`、`ingested`、`retrieval_ready`、`unsupported`、`failed`
- 不返回 API key、管理员账号、原始全文、私有 URL、完整 prompt 或未截断 provider trace。

### 1.1 文件类型路由建议

MaxKB 项目侧不需要决定某个文件是否业务通过，但需要按平台给出的文件类型做处理分流：

| 平台初判类型 | Provider 建议处理 |
| --- | --- |
| `pdf_text` | 直接抽取文本或 OCR 后入库 |
| `pdf_scan` | 调 PaddleOCR-VL 后入库 |
| `office_doc` | 转换/解析为文本或 Markdown 后入库 |
| `image` | 调 OCR，返回视觉断言候选和文本摘要 |
| `spreadsheet` | 转 CSV/表格摘要后入库 |
| `archive_nested` | 不递归展开业务范围，返回 `unsupported` 或请求平台展开后重交 |
| `unsupported` | 返回 `unsupported` 与安全原因 |

平台会保存 `manifestEntryId/sourceObjectId` 和业务分类；Provider 返回的 `unsupported`、`failed` 或低置信 OCR 结果会进入平台人工复核队列。

### 2. 核查项命中验收

```http
POST /api/knowledge/{knowledgeId}/retrieval-check
Authorization: Bearer <PREFLIGHT_API_KEY>
X-Correlation-ID: <platform-correlation-id>
```

请求要点：

- `reviewTaskId`
- `checkItemId`
- `query`
- `metadataFilters`: 项目、合同包、队伍、资料类型、依据版本
- `topK`

返回要点：

- `hits[]`: `providerDocumentId`、`providerChunkId`、`score`、`safeSnippet`、`locator`、`sourceObjectId`
- `diagnostics`: bounded status summary

## 联调判断

如果资料包是一整个 ZIP，推荐由前置平台先拆出 manifest 并完成业务范围判断，再把需要 OCR/入库/检索的文件引用交给 Worker/Proxy。这样可以保证：

- 平台知道每个文件为什么被纳入或排除。
- 人工复核可以落在平台任务上，而不是 MaxKB 内部状态上。
- MaxKB 可替换，不影响正式核查事实和报告归档。

## 给 MaxKB 项目侧的配合调整清单

1. 增加批量资料入库接口，支持一次接收平台拆包后的多文件 refs 和 metadata。
2. 增加每文件处理状态，尤其要有 `unsupported`，避免平台误以为资料已经有效入库。
3. 增加文件类型路由能力，按 `fileTypeRouteHint/documentTypeHint` 调 OCR、Office 解析、表格摘要或拒绝处理。
4. 检索接口支持 metadata filter：项目、合同包、参与机构、队伍、任务、资料类型、核查项。
5. 所有返回都只给安全摘要、locator、provider refs 和 bounded diagnostics，不返回原始全文、私有 URL、账号密码、token、完整 provider trace。
6. 支持 `Idempotency-Key` 和 `X-Correlation-ID`，方便前置平台重试和审计。
