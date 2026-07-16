# 开工条件核查单项目试点工作流

本阶段目标是跑通一个项目/合同包/参与机构/工作区内的真实试点闭环。平台先掌握业务事实和任务状态，Dify 或其他外部工作流只作为后续可选适配器。

## 事实源边界

- 结构化事实源目标为 PostgreSQL 或等价关系型数据库。
- 当前实现提供本地开发文件适配器，存储在 `.local-data/opening-condition-pilot-tasks.json`。
- 对象存储保存合同、核查表、资料包、证据附件和报告产物。
- 向量库只能做语义检索辅助，不能作为依据版本、主数据、核查结论或人工决策的事实源。

## 当前 API 合同

- `GET /api/opening-condition/pilot-tasks`
- `GET /api/opening-condition/pilot-tasks/:taskId`
- `PUT /api/opening-condition/pilot-tasks/:taskId`
- `POST /api/opening-condition/pilot-tasks/:taskId/packet`
- `POST /api/opening-condition/pilot-tasks/:taskId/match`
- `GET /api/opening-condition/pilot-tasks/:taskId/human-review`
- `POST /api/opening-condition/pilot-tasks/:taskId/human-review/:reviewId/decision`
- `POST /api/opening-condition/pilot-tasks/:taskId/report`
- `POST /api/opening-condition/pilot-tasks/:taskId/archive`
- `POST /api/opening-condition/pilot-tasks/:taskId/transition`
- `GET /api/opening-condition/workspaces/:workspaceId/basis`
- `PUT /api/opening-condition/workspaces/:workspaceId/basis/:basisId`
- `POST /api/opening-condition/workspaces/:workspaceId/basis/:basisId/publish`
- `GET /api/opening-condition/workspaces/:workspaceId/master-data`
- `PUT /api/opening-condition/workspaces/:workspaceId/master-data/:recordId`
- `POST /api/opening-condition/workspaces/:workspaceId/master-data/:recordId/decision`

这些接口先服务试点闭环，不代表最终权限和数据库迁移方案已经完成。

## 任务状态

```text
draft
  -> blocked_missing_basis
  -> blocked_missing_master_data
  -> ready_for_packet
  -> packet_uploaded
  -> extracting
  -> matching
  -> awaiting_human_review
  -> report_ready
  -> archived
  -> failed
  -> canceled
```

已归档、失败或取消的任务不能再回到执行中状态。状态事件只保存安全摘要，不保存密钥、私有 URL、原始 provider trace、完整 prompt 或未截断全文。

## 当前门禁

- 没有已发布依据版本时，任务会进入 `blocked_missing_basis`。
- 需要主数据但没有可用主数据引用时，任务会进入 `blocked_missing_master_data`。
- 资料包 intake 会保存核查表对象引用和资料对象清单，并写入 `packet_uploaded` 安全事件。
- 核查匹配优先使用确定性规则：核查表条目先匹配资料包文件名/摘要和已发布主数据，再为缺失、歧义、主数据缺口或视觉断言不确定创建人工复核项。
- 合同、补充协议等依据记录用于确认参与机构和合同工作范围；人员、设备核查项必须通过该工作区内已发布或人工批准的项目主数据确认，不能仅凭上传文件名或证书文本自动通过。
- 当前试点只核查资料核查范围；现场核查、应急响应、现场观测等无资料证据的条目应标记为 `out_of_scope` 或 `not_applicable`，不计为资料缺失失败。
- 签名、盖章、勾选、手写日期等视觉要素记录为 `visualAssertions`，只能说明检测或人工确认的存在性、清晰度和证据位置，不证明实体签章或签名真实有效。
- 人工复核项支持确认、修正、驳回和延期；阻塞项全部处理后，任务可进入 `report_ready`。
- 内部辅助报告摘要只能在阻塞人工复核项清零后生成，报告归档会保留任务、报告资产、证据摘要和事件链。
- 已发布依据版本会使同一工作区内先前发布的依据版本进入 `superseded`。
- 主数据可以通过人工决策发布、人工批准或驳回。
