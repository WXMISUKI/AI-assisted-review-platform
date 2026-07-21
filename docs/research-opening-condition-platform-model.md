# 开工条件核查平台模型研究

更新时间：2026-07-20

本文件仅做研究归纳，不替代正式法律意见或招标文件解释。结论分为三类：

- 法规事实：来自中国政府、交通运输部、住建部等一手来源。
- 平台产品事实：来自 Procore、Autodesk、Oracle Aconex 官方文档。
- 系统设计推断：结合上面两类事实，对本项目的落地建模建议。

## 1. 公路工程中项目、合同、单位/分包、危大/专业工程如何建模与隔离

### 法规事实

1. 公路建设项目的监管对象是“公路建设”的单位和人员，范围包含公路、桥梁、隧道、交通工程等。交通运输部《公路建设监督管理办法》明确了这一点。  
来源：[交通运输部《公路建设监督管理办法》](https://xxgk.mot.gov.cn/2020/jigou/fgs/202108/P020240425326448488525.pdf)

2. 公路工程施工分包的法定边界很清晰：承包人可以将所承包工程中的部分单位工程、分部工程或者分项工程发包给其他专业施工企业；分包人是承接这些部分工程的专业施工企业。  
来源：[交通运输部《公路工程施工分包管理办法》](https://xxgk.mot.gov.cn/xzgfxwj/202402/W020240226365994182916.pdf)

3. 公路工程里，单位工程、分部工程、分项工程的划分依据公路工程质量检验评定标准确定，不应由平台自创。  
来源：[交通运输部《公路工程施工分包管理办法》](https://xxgk.mot.gov.cn/xzgfxwj/202402/W020240226365994182916.pdf)  
来源：[交通运输部编译版《公路工程质量检验评定标准 第一册 土建工程》介绍](https://xxgk.mot.gov.cn/jigou/glj/202204/P020220425579065328485.pdf)

4. 公路工程质量评定体系长期采用“分项工程 -> 分部工程 -> 单位工程 -> 合同段 -> 建设项目”的逐级评定逻辑。  
来源：[交通运输部编译版《公路工程质量检验评定标准 第一册 土建工程》介绍](https://xxgk.mot.gov.cn/jigou/glj/202204/P020220425579065328485.pdf)

5. 公路水运工程安全管理里，官方常用表述是“风险等级较高的分部分项工程”“专项施工方案”“专家论证”，而不是住建口径里的“危大工程”作为主术语。  
来源：[交通运输部《公路水运工程安全生产监督管理办法》](https://xxgk.mot.gov.cn/2020/jigou/fgs/202006/t20200623_3307870.html)

6. “危大工程”这一术语在住建口径中主要用于房屋建筑和市政基础设施工程，不是公路工程的核心法定术语。  
来源：[住建部办公厅关于实施《危险性较大的分部分项工程安全管理规定》有关问题的通知](https://zjw.sh.gov.cn/cmsres/92/9250b0964a73451aa86795abf74b5116/86357e0ee134944d6ca8d06021f0b13b.pdf)

### 平台产品事实

1. Aconex、Procore 这类平台都把“项目”作为最高层上下文，用户通过 Project Selector / Portfolio 进入具体项目，而不是在全局里共享一套混合文档池。  
来源：[Aconex Project Selector / project list](https://help.aconex.com/your-account/hiding-and-showing-projects/)  
来源：[Procore Portfolio projects](https://v2.support.procore.com/en-ca/product-manuals/portfolio-company/tutorials/switch-between-views-in-the-projects-list/)

2. Aconex 的文档、工作流、任务、归档都围绕单项目组织，项目切换后上下文就变了。  
来源：[Aconex Documents](https://help.aconex.com/aconex/our-main-application/using-aconex/working-with-documents/)

### 系统设计推断

1. 本项目应把“项目 / 合同包 / 参与机构 / 工作区”拆成独立层级，而不是只用一个 projectId 粗暴承载全部上下文。

2. 建议最少分层如下：
   - `project`: 真实工程项目，作为最高隔离边界。
   - `contract_package`: 合同段、标段、施工总包合同包或履约单元。
   - `participating_organization`: 建设、监理、总包、分包、劳务、供应等参与方。
   - `workspace`: 某个项目内、面向某合同包和某参与范围的工作空间。
   - `basis_set`: 判定依据版本。
   - `master_data`: 人员、设备、证照、制度等主数据。
   - `work_package`: 专业工程、分包工程、风险较高分部分项工程、资料核查批次等业务包。

3. 在公路工程场景里，建议不要把“危大工程”直接当作唯一上层概念；更稳妥的做法是把它抽象成“风险较高的分部分项工程”或“专项施工方案对象”，再按业务需要映射到具体法规术语。

4. 分包和劳务合作必须分开建模：
   - 分包：对应部分单位工程/分部工程/分项工程，适用于专业化施工主体。
   - 劳务合作：以劳务活动为主，不能伪装成分包。
   来源：[交通运输部《公路工程施工分包管理办法》](https://xxgk.mot.gov.cn/xzgfxwj/202402/W020240226365994182916.pdf)

5. 你的判断“一个监理可能管多个项目，每个项目要有独立知识库隔离”是合理的，而且符合成熟平台的项目级隔离方式。这里建议再加一层“合同包/分包队伍”隔离，避免同项目内不同责任主体互相污染知识与证据。

## 2. 工程资料/知识库初始化的审核入库常见成熟做法

### 平台产品事实

1. Procore Document Management 采用“工具权限 + 细粒度权限组”的方式控制文件访问，并可按文档修订版本的状态、阶段、类型、专业等属性自动决定权限。  
来源：[Procore Document Management permissions](https://en-gb.support.procore.com/faq/how-do-permissions-work-in-the-document-management-tool)  
来源：[Procore Document Management getting started guide](https://support.procore.com/products/online/user-guide/project-level/document-management/document-management-getting-started-guide)

2. Procore 的文档工作流需要显式指定 workflow assignee，用户既要有工具权限，也要被加入工作流，才能开始或参与审查。  
来源：[Procore Document Management permissions](https://v2.support.procore.com/product-manuals/document-management-project/permissions)

3. Procore 的 Submittal 机制本质上是“经理建立条目 -> 分包商提供资料 -> 官方审查/批准”，并且支持工作流、响应、评论和附件。  
来源：[Procore Create a Submittal](https://v2.support.procore.com/product-manuals/submittals-project/tutorials/create-a-submittal/)  
来源：[Procore Respond to a Submittal as an Approver](https://v2.support.procore.com/product-manuals/submittals-project/tutorials/respond-to-a-submittal-as-an-approver)

4. Autodesk Docs 的 Review/Approve 流程支持 review status、comments、markups，且默认状态有 `In review / Approved / Rejected`。  
来源：[Autodesk Reviews FAQ and Review File Statuses](https://help.autodesk.com/view/DOCS/ENU/?guid=BIM360D_Document_Management_About_Reviews_Reviews_FAQs_Reference_html)  
来源：[Autodesk Review and Approve Files](https://help.autodesk.com/view/DOCS/ENU/?guid=Reviews_Review_and_Approve)

5. Autodesk 的 review markups 默认是私有的，只有创建者能看；Create 权限以上才能发布给项目成员。这很接近“先草稿审查，再正式入库”的思路。  
来源：[Autodesk Review and Approve Files](https://help.autodesk.com/view/DOCS/ENU/?guid=Reviews_Review_and_Approve)

6. Aconex 明确区分 Documents、Transmittals、Workflows。Workflow transmittal 会把待审文档带入工作流；Document Register 会随着 transmittal 自动更新，且 Aconex 还建议保留人工文控审计流程。  
来源：[Aconex Review documents from a workflow transmittal](https://help.aconex.com/workflows/review-documents-from-a-workflow-transmittal/)  
来源：[Aconex Project Preferences Guide](https://help.aconex.com/project-admins/aconex-project-preferences-guide/)  
来源：[Aconex difference between documents, transmittals, and mail](https://help.aconex.com/mail/what-is-the-difference-between-a-document%2C-a-transmittal%2C-and-a-/)

7. Aconex 的文档和邮件一旦入账就不会被删除，只能用新版本 supersede 旧版本；同时有完整 audit trail。  
来源：[Aconex version control and audit trail](https://help.aconex.com/high-compliance-environments/essentials/hce-how-do-version-control-and-the-aconex-audit-trail-work/)

### 系统设计推断

1. 工程资料或知识库初始化不应“上传即正式入库”，而应采用三段式：
   - 上传与解析
   - 人工复核预览
   - 确认后正式发布到 basis/master-data/knowledge-base

2. 这一点和成熟平台的实践一致：先有暂存区、审查区、工作流区，再进入正式文档注册或正式可见状态。

3. 对本项目来说，最稳妥的设计是：
   - 原始文件先进入对象存储和暂存记录。
   - OCR / 抽取结果先生成候选数据。
   - 人工复核确认后，再写入结构化主数据或知识库发布版本。

4. 对于合同、依据、制度、人员、设备、证照、模板等敏感资料，建议把“人工确认”作为正式入库的门槛，而不是把模型抽取结果直接当事实源。

5. 如果后续要做“知识库”，更适合先做“项目/合同包专属知识库 + 已确认证据片段库”，而不是直接做全局通用知识库。

## 3. 完整性核查、合规性核查、人工复核、报告和审计留痕的成熟流程

### 法规事实

1. 公路水运工程里，风险评估后，对风险等级较高的分部分项工程应编制专项施工方案，并附安全验算结果，经施工单位技术负责人签字后报监理工程师批准；必要时还要组织专家论证。  
来源：[交通运输部《公路水运工程安全生产监督管理办法》](https://xxgk.mot.gov.cn/2020/jigou/fgs/202006/t20200623_3307870.html)

2. 监理单位有责任审核施工项目安全生产条件，审查施工组织设计中的安全措施和专项施工方案；发现隐患应要求整改，情节严重可下暂停令并报告。  
来源：[交通运输部《公路水运工程安全生产监督管理办法》](https://xxgk.mot.gov.cn/2020/jigou/fgs/202006/t20200623_3307870.html)

3. 这说明公路工程并不是“文件是否齐全”就结束，而是要经过“风险识别 -> 方案编制 -> 审核/批准 -> 施工控制 -> 留痕追责”的链条。

### 平台产品事实

1. Autodesk 的 review 流程明确支持 In review、Approved、Rejected 状态，还支持评论、标注、审查详情和导出报告。  
来源：[Autodesk Reviews FAQ and Review File Statuses](https://help.autodesk.com/view/DOCS/ENU/?guid=BIM360D_Document_Management_About_Reviews_Reviews_FAQs_Reference_html)  
来源：[Autodesk Review and Approve Files](https://help.autodesk.com/view/DOCS/ENU/?guid=Reviews_Review_and_Approve)

2. Procore 的 Submittal 工作流支持通知、Ball in Court、评论、附件、响应时长报告，说明成熟平台会把“审查过程”本身当作数据资产。  
来源：[Procore Submittal workflow management](https://support.procore.com/products/online/user-guide/project-level/submittals/best-practices-submittals/best-practices-submittal-workflow-management)  
来源：[Procore Submittal approvers response time report](https://en-gb.support.procore.com/products/online/user-guide/project-level/submittals/tutorials/view-the-submittal-approvers-response-time-report)

3. Aconex 的 audit trail 会记录文档、邮件和报告的变更；文档一旦进入系统就保留历史，旧版本只能被新版本 supersede。  
来源：[Aconex version control and audit trail](https://help.aconex.com/high-compliance-environments/essentials/hce-how-do-version-control-and-the-aconex-audit-trail-work/)

4. Aconex 的 event log 还能追踪访问、发送、锁定、自动更新等事件，说明“审计留痕”要覆盖过程动作，而不是只留最终结论。  
来源：[Aconex event log](https://help.aconex.com/documents/view-the-event-log-to-see-which-users-have-accessed-or-changed-a/)

### 系统设计推断

1. 本项目应明确拆成四层：
   - 完整性核查：资料是否齐、是否缺项、是否可匹配。
   - 合规性核查：内容是否满足规则、标准、合同、主数据授权。
   - 人工复核：处理歧义、低置信度、视觉断言、规则冲突。
   - 报告与审计：固化结论、证据、版本、决策链。

2. 你当前工作流中“先做完整性匹配，再做人审，再生成报告”的方向是对的，但要再加一层明确的事实分离：
   - `missing`：未找到材料。
   - `present_but_questionable`：找到了材料，但不够合规或不够确定。
   - `approved`：人工或规则确认通过。
   - `rejected`：明确不通过。

3. 人工复核卡片必须至少展示：
   - 检查项 ID
   - 检查项名称
   - 所属父级分类
   - 触发原因
   - 命中的证据/缺失点
   - 规则说明或理由
   否则就会出现你现在看到的“只有 oc-check-001，看不懂在审什么”的问题。

4. 报告不应只是最终正文，还应保留：
   - 任务版本
   - 检查项版本
   - 证据清单
   - 人工决策
   - 操作日志
   - 归档时间
   - 审查人身份

5. 数据库设计上，建议把下面这些对象分开：
   - `workspace`
   - `basis_set_version`
   - `project_master_data`
   - `knowledge_base`
   - `packet`
   - `check_item`
   - `check_item_result`
   - `human_review_decision`
   - `report_asset`
   - `audit_event`

6. 对工程资料平台来说，最有价值的不是把模型“无限调准”，而是把“完整性、合规性、人工复核、报告留痕”做成可恢复、可追责、可归档的闭环。

## 综合结论

1. 你的方向总体是正确的：  
   - 先做项目/合同包级隔离。  
   - 再做资料初始化的人工确认。  
   - 再做完整性核查与合规性核查分层。  
   - 最后沉淀人工复核、报告和审计留痕。

2. 当前最需要修正的不是 UI 美化，而是域模型和状态流的清晰度：
   - 项目级隔离要明确。
   - 合同包 / 分包队伍要隔离。
   - “危大工程”应按公路工程语义重新抽象。
   - 资料入库要有审前确认。
   - 人工复核卡片必须可读。

3. 本项目建议优先落地的产品模型是：
   - 单项目试点闭环
   - 项目/合同包/参与机构/工作区隔离
   - 依据集确认
   - 主数据确认
   - 完整性匹配
   - 合规性复核
   - 人工决策
   - 报告归档

