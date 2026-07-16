export type OpeningConditionPacketStage =
  | "basis-confirmation"
  | "master-data-initialization"
  | "material-review"
  | "human-review"
  | "report-ready";

export type OpeningConditionRecordStatus =
  | "provisional"
  | "confirmed"
  | "published"
  | "pending-human-review"
  | "rejected"
  | "invalid"
  | "expired";

export type OpeningConditionWorkspaceRole =
  | "construction-unit-self-check"
  | "supervisor-assisted-review";

export type OpeningConditionBasisComponentType =
  | "contract"
  | "supplemental-agreement"
  | "checklist-template"
  | "regulation"
  | "project-rule"
  | "project-specific-requirement";

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

export type OpeningConditionScopeStatus = "in-scope" | "out-of-scope";

export type OpeningConditionDocumentPresence = "present" | "missing" | "ambiguous" | "not-required";

export type OpeningConditionRelevanceStatus =
  | "matched"
  | "wrong-subject"
  | "wrong-project"
  | "unconfirmed"
  | "not-applicable";

export type OpeningConditionContentCompliance =
  | "compliant"
  | "non-compliant"
  | "partially-compliant"
  | "not-evaluated";

export type OpeningConditionFinalDisposition =
  | "pass"
  | "fail"
  | "needs-human-review"
  | "blocked"
  | "not-applicable";

export interface OpeningConditionVisualAssertion {
  type: "stamp" | "signature" | "checkbox" | "handwritten-date" | "seal" | "other";
  status: "detected" | "missing" | "uncertain" | "confirmed" | "rejected" | "not-required";
  confidence: "high" | "medium" | "low";
  locator: string;
  evidenceIds: string[];
  requiresHumanReview: boolean;
  note: string;
}

export interface OpeningConditionWorkspace {
  id: string;
  tenantName: string;
  projectName: string;
  contractPackage: string;
  participatingOrganization: string;
  organizationRole: "construction-unit" | "general-contractor" | "subcontractor" | "supervisor" | "owner";
  purpose: string;
  roleContext: OpeningConditionWorkspaceRole;
  activeBasisSetVersionId?: string;
}

export interface OpeningConditionBasisVersion {
  id: string;
  workspaceId: string;
  title: string;
  componentType: OpeningConditionBasisComponentType;
  source: string;
  version: string;
  status: OpeningConditionRecordStatus;
  confirmedBy?: string;
  confirmedAt?: string;
  publishedAt?: string;
  correctionNote?: string;
  score?: number;
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
  workspaceId: string;
  type: OpeningConditionMasterDataType;
  label: string;
  normalizedValue: string;
  status: OpeningConditionRecordStatus;
  evidenceId: string;
  validity: string;
  confidence: "high" | "medium" | "low";
  confirmedBy?: string;
  confirmedAt?: string;
  publishedAt?: string;
  correctionNote?: string;
  score?: number;
  reviewNeededReason?: string;
}

export interface OpeningConditionHumanReviewItem {
  id: string;
  targetType: "basis" | "master-data" | "check-item";
  targetId: string;
  trigger: OpeningConditionReviewTrigger;
  reason: string;
  difyNode: string;
}

export interface OpeningConditionDifyWorkflowRunSummary {
  runId: string;
  workflowName: string;
  status: "queued" | "running" | "human-input-required" | "draft-ready" | "failed";
  startedAt: string;
  completedAt?: string;
  safeMessage: string;
}

export interface OpeningConditionDifyBridgeInput {
  workspaceId: string;
  packetId: string;
  basisSetVersionId?: string;
  sourceObjectKeys: string[];
  checklistObjectKey?: string;
}

export interface OpeningConditionDifyBridgeOutput {
  run: OpeningConditionDifyWorkflowRunSummary;
  basisCandidates?: OpeningConditionBasisVersion[];
  masterDataCandidates?: OpeningConditionMasterDataRecord[];
  checkItems?: OpeningConditionCheckItem[];
  humanInputItems?: OpeningConditionHumanReviewItem[];
  reportDraft?: {
    title: string;
    markdown: string;
    status: "draft";
  };
  diagnostics?: Record<string, unknown>;
  unsafe?: Record<string, unknown>;
}

export interface OpeningConditionDifyNormalizedOutput {
  run: OpeningConditionDifyWorkflowRunSummary;
  basisCandidates: OpeningConditionBasisVersion[];
  masterDataCandidates: OpeningConditionMasterDataRecord[];
  checkItems: OpeningConditionCheckItem[];
  humanReviewQueue: OpeningConditionHumanReviewItem[];
  reportDraft?: {
    title: string;
    markdown: string;
    status: "draft";
  };
  safeDiagnostics: {
    status: string;
    message: string;
    redactedFields: string[];
  };
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
  masterDataIds: string[];
  evidenceIds: string[];
  humanReviewIds: string[];
  blockedReason?: string;
  rectification: string;
  scopeStatus?: OpeningConditionScopeStatus;
  documentPresence?: OpeningConditionDocumentPresence;
  relevanceStatus?: OpeningConditionRelevanceStatus;
  contentCompliance?: OpeningConditionContentCompliance;
  visualAssertions?: OpeningConditionVisualAssertion[];
  finalDisposition?: OpeningConditionFinalDisposition;
}

export interface OpeningConditionReportSummary {
  title: string;
  conclusion: string;
  nextAction: string;
  disclaimer: string;
}

export interface OpeningConditionReviewPacket {
  id: string;
  workspaceId: string;
  workspaceContext: OpeningConditionWorkspace;
  boundBasisSetVersionId?: string;
  projectName: string;
  reviewTarget: string;
  serviceScenario: "contractor-self-check" | "supervisor-assisted-review";
  stage: OpeningConditionPacketStage;
  difyWorkflowName: string;
  basisVersions: OpeningConditionBasisVersion[];
  evidence: OpeningConditionEvidence[];
  masterData: OpeningConditionMasterDataRecord[];
  masterDataReadiness: {
    published: number;
    provisional: number;
    rejected: number;
    reviewNeeded: number;
  };
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
  "human-review": "平台人工复核",
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

export const openingConditionRecordStatusLabels: Record<OpeningConditionRecordStatus, string> = {
  provisional: "待确认",
  confirmed: "已确认",
  published: "已发布",
  "pending-human-review": "待人工复核",
  rejected: "已驳回",
  invalid: "无效",
  expired: "已过期",
};

export const openingConditionWorkspaces: OpeningConditionWorkspace[] = [
  {
    id: "oc-ws-g15-08-supervisor",
    tenantName: "华东高速建设管理中心",
    projectName: "G15嘉金段改扩建工程",
    contractPackage: "8标主线预制下部结构",
    participatingOrganization: "嘉金八标项目经理部",
    organizationRole: "construction-unit",
    purpose: "承台施工开工条件核查",
    roleContext: "supervisor-assisted-review",
    activeBasisSetVersionId: "basis-opening-2026-001",
  },
  {
    id: "oc-ws-g15-08-subcontract",
    tenantName: "华东高速建设管理中心",
    projectName: "G15嘉金段改扩建工程",
    contractPackage: "8标钢筋加工分包",
    participatingOrganization: "沪通钢筋加工专业分包队",
    organizationRole: "subcontractor",
    purpose: "钢筋加工场开工条件自查",
    roleContext: "construction-unit-self-check",
  },
];

export const openingConditionReviewPacket: OpeningConditionReviewPacket = {
  id: "ocr-open-cond-demo-001",
  workspaceId: "oc-ws-g15-08-supervisor",
  workspaceContext: openingConditionWorkspaces[0],
  boundBasisSetVersionId: "basis-opening-2026-001",
  projectName: "G15嘉金段改扩建工程8标",
  reviewTarget: "承台施工条件核查",
  serviceScenario: "supervisor-assisted-review",
  stage: "human-review",
  difyWorkflowName: "平台内可控工作流",
  basisVersions: [
    {
      id: "basis-contract-g15-08",
      workspaceId: "oc-ws-g15-08-supervisor",
      title: "8标承台施工分包合同与工作范围",
      componentType: "contract",
      source: "施工单位上传分包合同",
      version: "2026-07 contract boundary",
      status: "published",
      confirmedBy: "监理工程师",
      confirmedAt: "2026-07-15 09:05",
      publishedAt: "2026-07-15 09:18",
      score: 94,
      applicability: "确认嘉金八标项目经理部参与机构、承台施工范围和资料归属边界，不作为完整人员设备清单。",
      confidence: "high",
    },
    {
      id: "basis-opening-2026-001",
      workspaceId: "oc-ws-g15-08-supervisor",
      title: "承台施工条件核查表",
      componentType: "checklist-template",
      source: "监理上传核查表",
      version: "2026-07 contest draft",
      status: "published",
      confirmedBy: "监理工程师",
      confirmedAt: "2026-07-15 09:20",
      publishedAt: "2026-07-15 09:35",
      score: 96,
      applicability: "适用于本次承台开工条件资料核查。",
      confidence: "high",
    },
    {
      id: "basis-jtg-3650-2020",
      workspaceId: "oc-ws-g15-08-supervisor",
      title: "《公路桥涵施工技术规范》JTG/T 3650-2020",
      componentType: "regulation",
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
      workspaceId: "oc-ws-g15-08-supervisor",
      type: "personnel",
      label: "专职安全员 张工",
      normalizedValue: "张工 / 苏建安C3-2024-0123",
      status: "published",
      evidenceId: "ev-person-001",
      validity: "证书有效，岗位匹配",
      confidence: "high",
      confirmedBy: "监理工程师",
      confirmedAt: "2026-07-15 10:00",
      publishedAt: "2026-07-15 10:10",
      score: 95,
    },
    {
      id: "md-equipment-001",
      workspaceId: "oc-ws-g15-08-supervisor",
      type: "equipment",
      label: "25t 汽车吊",
      normalizedValue: "QY25K5-08 / 检验有效期 2026-11-30",
      status: "published",
      evidenceId: "ev-equipment-001",
      validity: "检验有效期覆盖拟开工日期",
      confidence: "high",
      confirmedBy: "监理工程师",
      confirmedAt: "2026-07-15 10:05",
      publishedAt: "2026-07-15 10:12",
      score: 97,
    },
    {
      id: "md-doc-001",
      workspaceId: "oc-ws-g15-08-supervisor",
      type: "system-document",
      label: "开工申请审批表",
      normalizedValue: "审批表签章字段待确认",
      status: "pending-human-review",
      evidenceId: "ev-stamp-001",
      validity: "签章日期 OCR 低置信度",
      confidence: "low",
      reviewNeededReason: "签章日期 OCR 低置信度，需人工确认。",
    },
  ],
  masterDataReadiness: {
    published: 2,
    provisional: 0,
    rejected: 0,
    reviewNeeded: 1,
  },
  humanReviewQueue: [
    {
      id: "hr-basis-001",
      targetType: "basis",
      targetId: "basis-jtg-3650-2020",
      trigger: "basis-unconfirmed",
      reason: "专项规范适用范围由 OCR/LLM 识别，需监理确认是否纳入本次核查依据。",
      difyNode: "依据确认人工复核",
    },
    {
      id: "hr-stamp-001",
      targetType: "master-data",
      targetId: "md-doc-001",
      trigger: "stamp-signature-uncertain",
      reason: "开工申请审批表签章区域识别置信度低，需要人工确认盖章单位与日期。",
      difyNode: "主数据字段修正人工复核",
    },
    {
      id: "hr-item-001",
      targetType: "check-item",
      targetId: "oc-check-003",
      trigger: "rule-semantic-conflict",
      reason: "规则判断缺少清晰签章日期，但语义节点认为审批链基本完整，需要人工裁定。",
      difyNode: "审查结论复核人工复核",
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
      masterDataIds: ["md-person-001"],
      evidenceIds: ["ev-person-001"],
      humanReviewIds: [],
      rectification: "无需整改。",
      scopeStatus: "in-scope",
      documentPresence: "present",
      relevanceStatus: "matched",
      contentCompliance: "compliant",
      visualAssertions: [],
      finalDisposition: "pass",
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
      masterDataIds: ["md-equipment-001"],
      evidenceIds: ["ev-equipment-001"],
      humanReviewIds: [],
      rectification: "无需整改。",
      scopeStatus: "in-scope",
      documentPresence: "present",
      relevanceStatus: "matched",
      contentCompliance: "compliant",
      visualAssertions: [],
      finalDisposition: "pass",
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
      masterDataIds: ["md-doc-001"],
      evidenceIds: ["ev-stamp-001"],
      humanReviewIds: ["hr-stamp-001", "hr-item-001"],
      blockedReason: "依赖的制度资料主数据仍待人工复核，不能自动判定通过。",
      rectification: "人工确认签章单位、签字人和日期；若无法确认，应补充清晰审批表。",
      scopeStatus: "in-scope",
      documentPresence: "present",
      relevanceStatus: "matched",
      contentCompliance: "not-evaluated",
      visualAssertions: [
        {
          type: "stamp",
          status: "uncertain",
          confidence: "low",
          locator: "第3页 / 签章区域",
          evidenceIds: ["ev-stamp-001"],
          requiresHumanReview: true,
          note: "检测到疑似施工单位盖章，但日期和签字清晰度不足；只能确认待复核存在性，不证明实体签章真实有效。",
        },
      ],
      finalDisposition: "needs-human-review",
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
      masterDataIds: [],
      evidenceIds: ["ev-basis-001"],
      humanReviewIds: ["hr-basis-001"],
      rectification: "由监理确认 JTG/T 3650-2020 等专项依据是否纳入本次辅助核查。",
      scopeStatus: "in-scope",
      documentPresence: "present",
      relevanceStatus: "unconfirmed",
      contentCompliance: "partially-compliant",
      visualAssertions: [],
      finalDisposition: "needs-human-review",
    },
    {
      id: "oc-check-005",
      category: "现场核查",
      subCategory: "现场条件",
      content: "现场临边防护、排水和应急物资布设情况。",
      mandatory: false,
      verdict: "warning",
      riskLevel: "medium",
      ruleExplanation: "该项属于现场核查范围，当前资料核查试点不依据资料包判定现场真实状态。",
      semanticNote: "已标记为本轮不适用，不计入资料缺失。",
      basisVersionId: "basis-opening-2026-001",
      masterDataIds: [],
      evidenceIds: [],
      humanReviewIds: [],
      rectification: "后续若接入现场照片、巡检记录或移动端核验，再进入现场核查流程。",
      scopeStatus: "out-of-scope",
      documentPresence: "not-required",
      relevanceStatus: "not-applicable",
      contentCompliance: "not-evaluated",
      visualAssertions: [],
      finalDisposition: "not-applicable",
    },
  ],
  reportSummary: {
    title: "开工条件核查内部辅助意见",
    conclusion: "当前资料基础条件基本具备；本核查包绑定合同边界 basis-contract-g15-08 与 basis-opening-2026-001 依据集版本。人员、设备已通过项目主数据确认，签章日期和专项依据适用性确认前不建议出具最终通过意见。",
    nextAction: "优先处理平台人工复核队列中的依据确认、签章字段确认和结论复核；现场核查项已标记为本轮不适用。",
    disclaimer: "本结果为平台智能辅助审查意见，不替代施工单位、监理单位及相关责任人的最终审核责任。",
  },
};

export function getOpeningConditionWorkspacePacket(workspaceId: string) {
  if (workspaceId === openingConditionReviewPacket.workspaceId) {
    return openingConditionReviewPacket;
  }

  const workspace =
    openingConditionWorkspaces.find((item) => item.id === workspaceId) ?? openingConditionWorkspaces[0];

  const basisVersions = openingConditionReviewPacket.basisVersions.map((basis) => ({
    ...basis,
    workspaceId: workspace.id,
    status: workspace.activeBasisSetVersionId ? basis.status : ("provisional" as const),
  }));
  const masterData = openingConditionReviewPacket.masterData.map((record) => ({
    ...record,
    workspaceId: workspace.id,
    status: workspace.activeBasisSetVersionId ? record.status : ("provisional" as const),
  }));
  const blockedReason = workspace.activeBasisSetVersionId
    ? undefined
    : "当前工作区尚未发布依据集版本，正式核查任务只能停留在待确认状态。";

  return {
    ...openingConditionReviewPacket,
    id: `ocr-open-cond-${workspace.id}`,
    workspaceId: workspace.id,
    workspaceContext: workspace,
    boundBasisSetVersionId: workspace.activeBasisSetVersionId,
    projectName: workspace.projectName,
    reviewTarget: workspace.purpose,
    serviceScenario:
      workspace.roleContext === "construction-unit-self-check"
        ? ("contractor-self-check" as const)
        : ("supervisor-assisted-review" as const),
    stage: workspace.activeBasisSetVersionId
      ? openingConditionReviewPacket.stage
      : ("basis-confirmation" as const),
    basisVersions,
    masterData,
    masterDataReadiness: getOpeningConditionMasterDataReadiness(masterData),
    checkItems: openingConditionReviewPacket.checkItems.map((item) =>
      blockedReason
        ? {
            ...item,
            verdict: "needs-human-review" as const,
            blockedReason,
            humanReviewIds: Array.from(new Set([...item.humanReviewIds, "hr-basis-blocked"])),
          }
        : item,
    ),
  };
}

export function getOpeningConditionMasterDataReadiness(
  records: OpeningConditionMasterDataRecord[],
) {
  return records.reduce(
    (summary, record) => {
      if (record.status === "published") summary.published += 1;
      if (record.status === "provisional" || record.status === "confirmed") summary.provisional += 1;
      if (record.status === "rejected") summary.rejected += 1;
      if (record.status === "pending-human-review") summary.reviewNeeded += 1;
      return summary;
    },
    {
      published: 0,
      provisional: 0,
      rejected: 0,
      reviewNeeded: 0,
    },
  );
}

export function normalizeOpeningConditionDifyOutput(
  output: OpeningConditionDifyBridgeOutput,
): OpeningConditionDifyNormalizedOutput {
  const unsafeKeys = Object.keys(output.unsafe ?? {});
  const diagnosticKeys = Object.keys(output.diagnostics ?? {}).filter((key) =>
    /secret|token|privateUrl|providerTrace|rawText/i.test(key),
  );
  const redactedFields = Array.from(new Set([...unsafeKeys, ...diagnosticKeys]));

  return {
    run: {
      ...output.run,
      safeMessage: output.run.safeMessage || "外部工作流状态已同步。",
    },
    basisCandidates: output.basisCandidates ?? [],
    masterDataCandidates: output.masterDataCandidates ?? [],
    checkItems: output.checkItems ?? [],
    humanReviewQueue: output.humanInputItems ?? [],
    reportDraft: output.reportDraft
      ? {
          title: output.reportDraft.title,
          markdown: output.reportDraft.markdown,
          status: "draft",
        }
      : undefined,
    safeDiagnostics: {
      status: output.run.status,
      message: output.run.safeMessage,
      redactedFields,
    },
  };
}

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
