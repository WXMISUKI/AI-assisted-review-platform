export type OpeningConditionPacketStage =
  | "basis-confirmation"
  | "master-data-initialization"
  | "material-review"
  | "human-review"
  | "report-ready";

export type OpeningConditionRecordStatus = "confirmed" | "pending-human-review" | "invalid" | "expired";

export type OpeningConditionMasterDataType =
  | "personnel"
  | "equipment"
  | "certificate"
  | "company"
  | "system-document";

export type OpeningConditionVerdict = "pass" | "fail" | "warning" | "needs-human-review";

export type OpeningConditionRiskLevel = "critical" | "high" | "medium" | "low";

export type OpeningConditionReviewTrigger =
  | "basis-unconfirmed"
  | "ocr-low-confidence"
  | "stamp-signature-uncertain"
  | "master-data-missing"
  | "rule-semantic-conflict";

export interface OpeningConditionBasisVersion {
  id: string;
  title: string;
  source: string;
  version: string;
  status: OpeningConditionRecordStatus;
  confirmedBy?: string;
  confirmedAt?: string;
  applicability: string;
  confidence: "high" | "medium" | "low";
}

export interface OpeningConditionEvidence {
  id: string;
  fileName: string;
  locator: string;
  extractedValue: string;
  confidence: "high" | "medium" | "low";
  masterDataId?: string;
}

export interface OpeningConditionMasterDataRecord {
  id: string;
  type: OpeningConditionMasterDataType;
  label: string;
  normalizedValue: string;
  status: OpeningConditionRecordStatus;
  evidenceId: string;
  validity: string;
  confidence: "high" | "medium" | "low";
}

export interface OpeningConditionHumanReviewItem {
  id: string;
  targetType: "basis" | "master-data" | "check-item";
  targetId: string;
  trigger: OpeningConditionReviewTrigger;
  reason: string;
  difyNode: string;
}

export interface OpeningConditionCheckItem {
  id: string;
  category: string;
  subCategory: string;
  content: string;
  mandatory: boolean;
  verdict: OpeningConditionVerdict;
  riskLevel: OpeningConditionRiskLevel;
  ruleExplanation: string;
  semanticNote?: string;
  basisVersionId: string;
  evidenceIds: string[];
  humanReviewIds: string[];
  rectification: string;
}

export interface OpeningConditionReportSummary {
  title: string;
  conclusion: string;
  nextAction: string;
  disclaimer: string;
}

export interface OpeningConditionReviewPacket {
  id: string;
  projectName: string;
  reviewTarget: string;
  serviceScenario: "contractor-self-check" | "supervisor-assisted-review";
  stage: OpeningConditionPacketStage;
  difyWorkflowName: string;
  basisVersions: OpeningConditionBasisVersion[];
  evidence: OpeningConditionEvidence[];
  masterData: OpeningConditionMasterDataRecord[];
  humanReviewQueue: OpeningConditionHumanReviewItem[];
  checkItems: OpeningConditionCheckItem[];
  reportSummary: OpeningConditionReportSummary;
}

export interface OpeningConditionVerdictSummary {
  total: number;
  passed: number;
  failed: number;
  warning: number;
  needsHumanReview: number;
  mandatoryFailures: number;
}

export interface OpeningConditionRiskSummary {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export const openingConditionStageLabels: Record<OpeningConditionPacketStage, string> = {
  "basis-confirmation": "判定依据确认",
  "master-data-initialization": "项目主数据初始化",
  "material-review": "开工条件资料核查",
  "human-review": "Dify 人工复核",
  "report-ready": "辅助报告归档",
};

export const openingConditionVerdictLabels: Record<OpeningConditionVerdict, string> = {
  pass: "符合",
  fail: "不符合",
  warning: "需关注",
  "needs-human-review": "待人工复核",
};

export const openingConditionRiskLabels: Record<OpeningConditionRiskLevel, string> = {
  critical: "严重",
  high: "高",
  medium: "中",
  low: "低",
};

export const openingConditionReviewPacket: OpeningConditionReviewPacket = {
  id: "ocr-open-cond-demo-001",
  projectName: "G15嘉金段改扩建工程8标",
  reviewTarget: "承台施工条件核查",
  serviceScenario: "supervisor-assisted-review",
  stage: "human-review",
  difyWorkflowName: "开工条件核查",
  basisVersions: [
    {
      id: "basis-opening-2026-001",
      title: "承台施工条件核查表",
      source: "监理上传核查表",
      version: "2026-07 contest draft",
      status: "confirmed",
      confirmedBy: "监理工程师",
      confirmedAt: "2026-07-15 09:20",
      applicability: "适用于本次承台开工条件资料核查。",
      confidence: "high",
    },
    {
      id: "basis-jtg-3650-2020",
      title: "《公路桥涵施工技术规范》JTG/T 3650-2020",
      source: "项目规范库",
      version: "2020",
      status: "pending-human-review",
      applicability: "用于吊装、现场施工和质量安全资料核查条款绑定。",
      confidence: "medium",
    },
  ],
  evidence: [
    {
      id: "ev-person-001",
      fileName: "项目管理人员资格报审表.pdf",
      locator: "第2页 / 表格第4行",
      extractedValue: "专职安全员：张工，证书编号 苏建安C3-2024-0123",
      confidence: "high",
      masterDataId: "md-person-001",
    },
    {
      id: "ev-equipment-001",
      fileName: "汽车吊检验报告.pdf",
      locator: "第1页 / 设备编号栏",
      extractedValue: "设备编号 QY25K5-08，检验有效期至 2026-11-30",
      confidence: "high",
      masterDataId: "md-equipment-001",
    },
    {
      id: "ev-stamp-001",
      fileName: "开工申请审批表.pdf",
      locator: "第3页 / 签章区域",
      extractedValue: "施工单位盖章疑似完整，签字日期不清晰",
      confidence: "low",
    },
    {
      id: "ev-basis-001",
      fileName: "承台施工条件核查表.docx",
      locator: "表格标题与资料核查区",
      extractedValue: "资料核查：人员、设备器具、方案制度、测量试验资料",
      confidence: "medium",
    },
  ],
  masterData: [
    {
      id: "md-person-001",
      type: "personnel",
      label: "专职安全员 张工",
      normalizedValue: "张工 / 苏建安C3-2024-0123",
      status: "confirmed",
      evidenceId: "ev-person-001",
      validity: "证书有效，岗位匹配",
      confidence: "high",
    },
    {
      id: "md-equipment-001",
      type: "equipment",
      label: "25t 汽车吊",
      normalizedValue: "QY25K5-08 / 检验有效期 2026-11-30",
      status: "confirmed",
      evidenceId: "ev-equipment-001",
      validity: "检验有效期覆盖拟开工日期",
      confidence: "high",
    },
    {
      id: "md-doc-001",
      type: "system-document",
      label: "开工申请审批表",
      normalizedValue: "审批表签章字段待确认",
      status: "pending-human-review",
      evidenceId: "ev-stamp-001",
      validity: "签章日期 OCR 低置信度",
      confidence: "low",
    },
  ],
  humanReviewQueue: [
    {
      id: "hr-basis-001",
      targetType: "basis",
      targetId: "basis-jtg-3650-2020",
      trigger: "basis-unconfirmed",
      reason: "专项规范适用范围由 OCR/LLM 识别，需监理确认是否纳入本次核查依据。",
      difyNode: "依据确认 Human Input",
    },
    {
      id: "hr-stamp-001",
      targetType: "master-data",
      targetId: "md-doc-001",
      trigger: "stamp-signature-uncertain",
      reason: "开工申请审批表签章区域识别置信度低，需要人工确认盖章单位与日期。",
      difyNode: "主数据字段修正 Human Input",
    },
    {
      id: "hr-item-001",
      targetType: "check-item",
      targetId: "oc-check-003",
      trigger: "rule-semantic-conflict",
      reason: "规则判断缺少清晰签章日期，但语义节点认为审批链基本完整，需要人工裁定。",
      difyNode: "审查结论复核 Human Input",
    },
  ],
  checkItems: [
    {
      id: "oc-check-001",
      category: "资料核查",
      subCategory: "人员",
      content: "项目管理人员及专职安全员资格证书齐全且在有效期内。",
      mandatory: true,
      verdict: "pass",
      riskLevel: "low",
      ruleExplanation: "专职安全员证书编号已在项目人员主数据中命中，证书状态有效。",
      semanticNote: "人员岗位与承台施工准备阶段匹配。",
      basisVersionId: "basis-opening-2026-001",
      evidenceIds: ["ev-person-001"],
      humanReviewIds: [],
      rectification: "无需整改。",
    },
    {
      id: "oc-check-002",
      category: "资料核查",
      subCategory: "设备器具",
      content: "进场起重设备检验报告、设备编号和有效期满足本次施工条件。",
      mandatory: true,
      verdict: "pass",
      riskLevel: "low",
      ruleExplanation: "设备编号 QY25K5-08 与检验报告一致，有效期覆盖拟开工日期。",
      basisVersionId: "basis-opening-2026-001",
      evidenceIds: ["ev-equipment-001"],
      humanReviewIds: [],
      rectification: "无需整改。",
    },
    {
      id: "oc-check-003",
      category: "资料核查",
      subCategory: "审批签章",
      content: "开工申请审批表签章、签字、日期应完整清晰。",
      mandatory: true,
      verdict: "needs-human-review",
      riskLevel: "high",
      ruleExplanation: "签章区域存在，但签字日期 OCR 置信度低，无法自动确认审批链完整。",
      semanticNote: "文档上下文显示审批表结构完整，但关键日期不可稳定识别。",
      basisVersionId: "basis-opening-2026-001",
      evidenceIds: ["ev-stamp-001"],
      humanReviewIds: ["hr-stamp-001", "hr-item-001"],
      rectification: "人工确认签章单位、签字人和日期；若无法确认，应补充清晰审批表。",
    },
    {
      id: "oc-check-004",
      category: "资料核查",
      subCategory: "依据完整性",
      content: "本次核查依据应覆盖开工资料、人员、设备、方案制度和现场条件。",
      mandatory: false,
      verdict: "warning",
      riskLevel: "medium",
      ruleExplanation: "核查表已覆盖资料核查项，但专项规范适用性仍待确认。",
      basisVersionId: "basis-jtg-3650-2020",
      evidenceIds: ["ev-basis-001"],
      humanReviewIds: ["hr-basis-001"],
      rectification: "由监理确认 JTG/T 3650-2020 等专项依据是否纳入本次辅助核查。",
    },
  ],
  reportSummary: {
    title: "开工条件核查内部辅助意见",
    conclusion: "当前资料基础条件基本具备，但存在 3 项待人工复核内容，签章日期和依据适用性确认前不建议出具最终通过意见。",
    nextAction: "优先处理 Dify Human Input 队列中的依据确认、签章字段确认和结论复核。",
    disclaimer: "本结果为平台智能辅助审查意见，不替代施工单位、监理单位及相关责任人的最终审核责任。",
  },
};

export function getOpeningConditionVerdictSummary(
  packet: OpeningConditionReviewPacket,
): OpeningConditionVerdictSummary {
  return packet.checkItems.reduce(
    (summary, item) => {
      summary.total += 1;

      if (item.verdict === "pass") summary.passed += 1;
      if (item.verdict === "fail") summary.failed += 1;
      if (item.verdict === "warning") summary.warning += 1;
      if (item.verdict === "needs-human-review") summary.needsHumanReview += 1;
      if (item.mandatory && item.verdict === "fail") summary.mandatoryFailures += 1;

      return summary;
    },
    {
      total: 0,
      passed: 0,
      failed: 0,
      warning: 0,
      needsHumanReview: 0,
      mandatoryFailures: 0,
    },
  );
}

export function getOpeningConditionRiskSummary(
  packet: OpeningConditionReviewPacket,
): OpeningConditionRiskSummary {
  return packet.checkItems.reduce(
    (summary, item) => {
      summary[item.riskLevel] += 1;
      return summary;
    },
    { critical: 0, high: 0, medium: 0, low: 0 },
  );
}

export function getOpeningConditionHumanReviewItems(packet: OpeningConditionReviewPacket) {
  return packet.humanReviewQueue.map((item) => {
    const checkItem = packet.checkItems.find((candidate) => candidate.id === item.targetId);
    const basis = packet.basisVersions.find((candidate) => candidate.id === item.targetId);
    const masterData = packet.masterData.find((candidate) => candidate.id === item.targetId);

    return {
      ...item,
      targetLabel: checkItem?.content ?? basis?.title ?? masterData?.label ?? item.targetId,
    };
  });
}
