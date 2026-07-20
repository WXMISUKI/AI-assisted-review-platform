# 开工条件单项目真实试点联调 Runbook

更新时间：2026-07-20

## 结论

当前最值得推进的是“单项目开工条件核查试点联调”，用真实合同/资质依据、资料核查表和资料包 ZIP 跑通平台链路：

```text
平台任务初始化
  -> 证据上传到对象存储
  -> 依据发布与试点主数据确认
  -> MaxKB Provider Proxy 绑定
  -> ZIP manifest 提取
  -> 正式资料匹配
  -> 人工复核
  -> 辅助报告归档
```

这不是完整生产多租户平台，也不是把 Dify 工作流搬进来。目标是用真实资料暴露链路问题，快速校准项目定位、数据模型、OCR Worker 对接和后续知识库入库策略。

## 成熟平台流程校准

参考公开官方文档：

- Procore Project-level Submittals: https://support.procore.com/products/online/user-guide/project-level/submittals
- Autodesk Construction Cloud / Build Submittals: https://help.autodesk.com/view/BUILD/ENU/?guid=Submittals

成熟工程资料平台的共性是：

1. 先有项目、角色、提交项或资料登记台账。
2. 再围绕合同、规范、图纸、核查表或提交包建立资料要求。
3. 上传资料通常进入某个 submittal item/package 或 document package，而不是散落在通用文件夹。
4. 审核过程强调状态、版本、流转、回复、分发和审计轨迹。
5. 自动化能力可以辅助检查缺漏、检索、摘要或提醒，但正式结论仍归属于平台流程和人工审批记录。

因此，本项目的合理流程不是“先把所有文件扔给 AI”，而是：

```text
项目/合同包/参与机构
  -> 合同或资质依据确认
  -> 人员设备等项目主数据确认
  -> 资料核查表定义核查项
  -> 资料包 ZIP 接入并提取清单
  -> OCR/知识库作为支撑能力
  -> 平台执行匹配和人工复核
```

## 当前平台已有前提

已具备：

- 登录后产品入口区分：施工方案审查、开工条件核查。
- 开工条件 pilot task 状态机。
- 依据版本、主数据、知识库、资料包、人工复核、报告归档的本地开发存储。
- MinIO 通用上传接口。
- ZIP manifest 提取能力。
- MaxKB Provider Proxy readiness 和安全 provider refs。
- 核查表模板适配：当前已支持 `承台施工条件核查表` 的受控模板。

## 本轮新增入口

开工条件页面新增“真实试点资料接入”：

1. 选择合同/资质依据文件，例如 `结构资质报审表及附件(1).pdf`。
2. 选择资料核查表，例如 `承台施工条件核查表.docx`。
3. 选择核查资料包 ZIP，例如 `条件核查.zip`。
4. 前端依次通过 `/api/minio/upload` 上传三个文件。
5. 前端调用 `/api/opening-condition/pilot-tasks/trial-bootstrap`。
6. 后端创建发布依据、试点主数据、知识库绑定、pilot task 和资料包清单。

## 当前边界

- 不支持浏览器直接读取本机 `C:\project\file`，用户需要在页面文件选择器中选择这些文件。
- 不新增任意本地路径读取接口，避免把开发机路径能力变成生产风险。
- 本轮只提取 ZIP 清单，不把 ZIP 内每个文件批量提交 OCR Worker。
- 本轮主数据是试点操作员确认的临时主数据，用于跑通人员/设备授权门禁；生产化前必须替换为 OCR/人工正式确认流程。
- MaxKB 命中只能作为支持证据，不自动通过核查项。

## 下一阶段建议

1. 把 trial task 的 evidence object refs 批量提交给 OCR Worker。
2. 保存 OCR Worker ingestion id、状态、结构化摘要和 MaxKB document refs。
3. 对关键核查项增加 MaxKB retrieval-check 事件和命中摘要。
4. 把人工复核页从“队列摘要”升级为可逐项确认、修正、驳回的操作台。
5. 报告归档从内部摘要升级为可下载报告资产。
