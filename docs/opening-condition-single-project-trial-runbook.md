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

## 真实样本重复运行操作步骤

以下步骤用于下一轮真实样本联调。请优先通过浏览器文件选择器操作，不要通过命令行传本机路径；浏览器上传链路才能保留真实中文文件名和安全 object ref。

1. 打开本地前端 `http://127.0.0.1:5173/`。
2. 登录后选择“开工条件核查”。
3. 进入左侧“资料接入”。
4. 在“真实试点资料接入”区域依次选择：
   - 合同/资质依据：例如 `结构资质报审表及附件(1).pdf`
   - 资料核查表：例如 `承台施工条件核查表.docx`
   - 核查资料包：例如 `条件核查.zip`
5. 点击“上传并初始化试点”。
6. 初始化完成后，在“真实试点诊断”区域检查：
   - 资料对象数量是否为 1 个 ZIP 或预期数量
   - Manifest 条目数是否符合 ZIP 内文件数量
   - 核查表解析是否为 `derived_from_template`、`direct_input`、`reused_existing_task` 或 `manual_definition_required`
   - Provider 状态是否为 ready/provisional/stale/unreachable
   - 是否出现 blockingReasons
7. 点击“执行正式核查”。
8. 进入“资料核查”，检查后端 checkItems/evidence 是否优先展示，记录误判、漏判、文件名乱码、证据定位不清的问题。
9. 进入“人工复核”，对 open/deferred 项逐项选择确认、修正、延期或驳回；记录每个复核项的业务原因。
10. 进入“报告归档”，点击“生成报告摘要”，检查报告包中的输入文件、核查计数、证据计数、人工复核计数、provider/blocking 摘要。
11. 点击“归档任务”，确认状态变为 archived，且“生成报告摘要”不可再次触发。

## 联调问题记录清单

请在联调时按下面格式把问题反馈给开发侧：

- 当前页面：资料接入 / 资料核查 / 人工复核 / 报告归档
- 当前任务状态：例如 packet_uploaded / awaiting_human_review / report_ready / archived
- 看到的提示或 blockingReasons：
- 使用的三个文件名：
- Manifest 条目数和样例文件名是否正确：
- 核查表解析结果：
- Provider 状态：
- 人工复核项数量和原因：
- 报告摘要是否生成：
- 浏览器控制台或后端日志中的错误：

本阶段不追求一次性解决所有识别准确率问题。优先记录会阻断“真实资料进入正式核查、人工复核、报告生成和归档”的问题。

## 归档后再次运行

同一工作区完成报告归档后，原任务会保持 `archived`，后端不会允许再次初始化这个 taskId。这是归档不可变规则，不是上传失败。

如果需要用同一工作区再次上传合同依据、核查表和资料包 ZIP，直接回到“资料接入”页重新选择三份文件并点击“上传并初始化试点”。页面会为本次上传创建新的运行任务，例如 `oc-pilot-{workspaceId}-run-{timestamp}`，后续“执行正式核查 -> 人工复核 -> 报告生成 -> 归档”都应围绕这个新任务继续。

联调时请记录页面显示的新任务 ID，以及是否仍出现 `Cannot reinitialize opening-condition pilot task while task is archived.`。修复后的预期是：已归档旧任务保持不变，新上传进入新的 `packet_uploaded` 或后端派生状态。
