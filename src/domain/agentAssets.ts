import type { ReviewAgentKey } from "./reviewTypes";

export interface AgentAssetProfile {
  key: ReviewAgentKey;
  name: string;
  schemaVersion: string;
  promptAsset: string;
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
    schemaVersion: "opening-condition-0.1-contest",
    promptAsset: "开工条件资料核查 Prompt v0.1",
    stageHint: "Dify 编排、人审节点与平台规则结果桥接",
    summary: "负责把开工条件核查表、体系资料包、人员设备证照和签章资料转为可复核的辅助审查结论。",
    engines: ["Dify Workflow", "主数据比对", "规则核查", "LLM 语义辅助", "Human Input 复核"],
    checkDomains: ["判定依据确认", "人员设备证照", "审批签章", "方案制度", "资料完整性"],
    outputScenarios: ["施工单位自查", "监理辅助审核", "参赛演示闭环"],
    basisCategories: ["开工条件核查表", "项目体系建设资料", "人员设备证照", "专项规范与项目制度"],
    knowledgeBindings: [
      { name: "Dify 开工条件核查工作流", status: "已验证原型" },
      { name: "项目人员设备证照主数据", status: "本轮建模" },
      { name: "Human Input 人工复核节点", status: "桥接设计" },
      { name: "辅助报告模板", status: "待接入" },
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
  },
  {
    name: "开工条件资料核查 Prompt v0.1",
    version: "v0.1",
    owner: "参赛核查工作流",
    status: "草稿",
    description: "用于从核查表与资料包中抽取核查项、证据、主数据候选和复核原因。",
  },
];
