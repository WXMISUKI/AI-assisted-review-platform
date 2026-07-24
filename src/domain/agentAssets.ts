import type { ReviewAgentKey } from "./reviewTypes";

export interface AgentAssetProfile {
  key: ReviewAgentKey;
  name: string;
  assetType?: "agent" | "adapter";
  schemaVersion: string;
  promptAsset: string;
  templateAsset?: string;
  adapterBinding?: string;
  readinessStatus?: string;
  stageHint: string;
  summary: string;
  engines: string[];
  checkDomains: string[];
  outputScenarios: string[];
  basisCategories?: string[];
  knowledgeBindings: Array<{
    name: string;
    status: string;
  }>;
}

export interface PromptAssetEntry {
  name: string;
  version: string;
  owner: string;
  status: "已绑定" | "待绑定" | "草稿";
  description: string;
  bindingTarget?: string;
}

export const agentAssetCatalog: AgentAssetProfile[] = [
  {
    key: "structure-restoration",
    name: "文档结构恢复智能体",
    schemaVersion: "structure-pass-1.0-mock",
    promptAsset: "专项施工方案结构恢复 Prompt v0.2",
    stageHint: "OCR 后的版面恢复与段落切分",
    summary: "负责把 OCR 原始文本还原成可审查的章节、段落和锚点，供后续审查智能体使用。",
    engines: ["版面解析", "段落切分", "结构标准化"],
    checkDomains: ["章节重建", "表格还原", "文本锚点对齐"],
    outputScenarios: ["结构化预处理", "审查准备", "结果回放"],
    basisCategories: ["OCR 结果 JSONL", "页面文本块", "段落锚点"],
    knowledgeBindings: [
      { name: "OCR 输出 JSONL", status: "待接入" },
      { name: "项目文档结构规则", status: "预留入口" },
      { name: "段落锚点规范", status: "预留入口" },
    ],
  },
  {
    key: "construction-review",
    name: "施工方案审查智能体",
    schemaVersion: "review-kernel-2.1-mock",
    promptAsset: "专项施工方案审查 Prompt v0.3",
    stageHint: "依据匹配、规则审查与语义研判",
    summary: "负责专项施工方案的规范符合性、程序合规与工程技术判断。",
    engines: ["强规则引擎", "大模型语义推理", "结构化结论生成"],
    checkDomains: ["编制内容", "程序合规", "专业技术", "实施一致性"],
    outputScenarios: ["施工单位内审辅助", "监理正式审查", "专家论证辅助"],
    basisCategories: [
      "JT/T 1495-2024",
      "JTG F90-2015",
      "JTG G10-2016",
      "招投标/合同/图纸",
      "施工安全风险评估报告",
    ],
    knowledgeBindings: [
      { name: "规范知识图谱", status: "预留入口" },
      { name: "项目招投标与合同文件", status: "待接入" },
      { name: "设计图纸与施工组织设计", status: "待接入" },
      { name: "安全风险评估报告", status: "待接入" },
    ],
  },
  {
    key: "opening-condition-review",
    name: "开工条件核查智能体",
    assetType: "agent",
    schemaVersion: "opening-condition-0.1-contest",
    promptAsset: "开工条件资料核查 Prompt v0.1",
    templateAsset: "开工条件问题分类模板 v0.1",
    readinessStatus: "问题分类与报告包已建模",
    stageHint: "平台内可控工作流、人审节点与平台规则结果桥接；Dify 可作为后续适配器",
    summary: "负责把开工条件核查表、体系资料包、人员设备证照和签章资料转为可复核的辅助审查结论。",
    engines: ["平台可控工作流", "主数据比对", "规则核查", "LLM 语义辅助", "人工复核"],
    checkDomains: ["判定依据确认", "人员设备证照", "审批签章", "方案制度", "资料完整性"],
    outputScenarios: ["施工单位自查", "监理辅助审核", "参赛演示闭环"],
    basisCategories: ["开工条件核查表", "项目体系建设资料", "人员设备证照", "专项规范与项目制度"],
    knowledgeBindings: [
      { name: "开工条件核查可选外部工作流适配器", status: "已验证原型" },
      { name: "项目人员设备证照主数据", status: "本轮建模" },
      { name: "平台人工复核节点", status: "桥接设计" },
      { name: "辅助报告模板", status: "待接入" },
    ],
  },
  {
    key: "opening-condition-issue-review",
    name: "开工条件问题类型审查智能体",
    assetType: "agent",
    schemaVersion: "opening-condition-issue-taxonomy-1.0",
    promptAsset: "开工条件问题分类 Prompt v0.1",
    templateAsset: "十二类问题分类模板 v0.1",
    readinessStatus: "已绑定 taxonomy hooks",
    stageHint: "围绕问题类型、风险等级、法规依据和整改要求生成稳定结构化结论",
    summary: "负责把开工条件核查失败项映射为平台问题类型，并绑定法规依据、整改建议与后续复核语义。",
    engines: ["规则映射", "问题结构化", "法规依据补全"],
    checkDomains: ["十二类问题分类", "风险等级", "法规依据", "整改要求"],
    outputScenarios: ["正式核查问题归类", "整改交付包", "后续法规整改智能体输入"],
    basisCategories: ["核查项结果", "主数据授权边界", "项目制度与规范依据"],
    knowledgeBindings: [
      { name: "开工条件问题 taxonomy", status: "已绑定" },
      { name: "法规依据摘要模板", status: "预留入口" },
      { name: "问题复核提示词", status: "草稿" },
    ],
  },
  {
    key: "opening-condition-rectification-guidance",
    name: "法规整改建议智能体",
    assetType: "agent",
    schemaVersion: "opening-condition-rectification-0.1",
    promptAsset: "开工条件整改建议 Prompt v0.1",
    templateAsset: "整改要求与复核意见模板 v0.1",
    readinessStatus: "等待真实法规库接入",
    stageHint: "针对不符合项生成整改要求、核验标准和复审建议，不直接替代监理最终意见",
    summary: "负责根据问题类型和法规依据形成整改要求、复核标准与下一轮复审建议。",
    engines: ["法规规则拼装", "整改话术模板", "复核建议生成"],
    checkDomains: ["整改要求", "核验标准", "复审建议"],
    outputScenarios: ["整改通知", "复审建议", "报告整改段落"],
    basisCategories: ["问题分类结果", "法规依据", "历史复审结论"],
    knowledgeBindings: [
      { name: "法规整改模板", status: "草稿" },
      { name: "整改闭环规则", status: "已建模" },
      { name: "复审建议模板", status: "待接入" },
    ],
  },
  {
    key: "opening-condition-export-adapter",
    name: "开工条件原表回填/导出适配器",
    assetType: "adapter",
    schemaVersion: "opening-condition-export-handoff-0.1",
    promptAsset: "开工条件报告回填 Prompt v0.1",
    templateAsset: "原表回填模板 v0.1",
    adapterBinding: "docxToHtml / htmlToDocx (待接入)",
    readinessStatus: "平台 handoff 已预留",
    stageHint: "消费平台结构化报告包，供原表回填、文档导出与 Dify/外部工作流桥接",
    summary: "负责把平台 findings package 转换为原表回填或文档导出所需的稳定输入，不拥有业务状态。",
    engines: ["handoff contract", "模板绑定", "适配器桥接"],
    checkDomains: ["原表回填", "文档导出", "适配状态治理"],
    outputScenarios: ["docx 原表回填", "html 中间态", "导出交付件"],
    basisCategories: ["报告交付包", "核查表原文件", "导出模板"],
    knowledgeBindings: [
      { name: "原表回填 handoff contract", status: "本轮建模" },
      { name: "docx/html 外部接口", status: "待接入" },
      { name: "导出模板映射", status: "草稿" },
    ],
  },
  {
    key: "report-generation",
    name: "审查报告生成智能体",
    schemaVersion: "report-gen-1.0-mock",
    promptAsset: "监理审查报告 Prompt v0.1",
    stageHint: "审查完成后的结果汇总与报告包装",
    summary: "负责根据已接受/已拒绝问题、审查模式和文档结果生成监理或整改报告。",
    engines: ["结果归纳", "意见组织", "报告生成"],
    checkDomains: ["问题汇总", "整改建议", "结论包装"],
    outputScenarios: ["监理报告", "整改清单", "结果快照"],
    basisCategories: ["已接受问题", "已拒绝问题", "修订后文本快照"],
    knowledgeBindings: [
      { name: "审查结论模板", status: "待接入" },
      { name: "报告格式规范", status: "预留入口" },
    ],
  },
];

export const promptAssetRegistry: PromptAssetEntry[] = [
  {
    name: "专项施工方案结构恢复 Prompt v0.2",
    version: "v0.2",
    owner: "平台内核",
    status: "草稿",
    description: "用于把 OCR 结果整理为章节、段落、列表和锚点。",
  },
  {
    name: "专项施工方案审查 Prompt v0.3",
    version: "v0.3",
    owner: "审查内核",
    status: "已绑定",
    description: "用于施工方案审查智能体的规则与语义分析。",
  },
  {
    name: "监理审查报告 Prompt v0.1",
    version: "v0.1",
    owner: "报告内核",
    status: "待绑定",
    description: "用于将接受/拒绝结果整理为专属监理报告。",
    bindingTarget: "审查报告生成智能体",
  },
  {
    name: "开工条件资料核查 Prompt v0.1",
    version: "v0.1",
    owner: "参赛核查工作流",
    status: "草稿",
    description: "用于从核查表与资料包中抽取核查项、证据、主数据候选和复核原因。",
    bindingTarget: "开工条件核查智能体",
  },
  {
    name: "开工条件问题分类 Prompt v0.1",
    version: "v0.1",
    owner: "开工条件问题内核",
    status: "已绑定",
    description: "用于把核查项结果映射为问题类型、法规依据与整改要求。",
    bindingTarget: "开工条件问题类型审查智能体",
  },
  {
    name: "开工条件整改建议 Prompt v0.1",
    version: "v0.1",
    owner: "开工条件整改内核",
    status: "草稿",
    description: "用于生成法规整改建议、复核标准和下一轮复审动作。",
    bindingTarget: "法规整改建议智能体",
  },
  {
    name: "开工条件报告回填 Prompt v0.1",
    version: "v0.1",
    owner: "导出适配内核",
    status: "待绑定",
    description: "用于把结构化报告包转换为原表回填或导出所需的中间结构。",
    bindingTarget: "开工条件原表回填/导出适配器",
  },
];
