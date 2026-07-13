import type {
  BasisReference,
  DocumentParagraph,
  RecoveredDocumentStructure,
  ReviewIssue,
} from "./reviewTypes";

type DraftRule = {
  id: string;
  title: string;
  severity: ReviewIssue["severity"];
  matchers: string[];
  reason: string;
  basis: string;
  suggestion: string;
  kernel: NonNullable<ReviewIssue["kernel"]>;
};

const basisReferences: Record<string, BasisReference> = {
  scaffold: {
    type: "normative-standard",
    sourceTitle: "公路水运危险性较大工程安全专项施工方案审查规程",
    version: "JT/T 1495-2024",
    clauseNumber: "附录 A-D / 第 6 章",
    summary: "达到危大或超危大范围的工程应按规定履行专项方案编审、审查和必要的专家论证程序。",
    priority: "primary",
  },
  lifting: {
    type: "normative-standard",
    sourceTitle: "公路工程施工安全技术规范",
    version: "JTG F90-2015",
    clauseNumber: "起重吊装及特种设备安全要求",
    summary: "起重机械安装、附着、验收和使用应采用可靠连接并满足专项方案和设备技术文件要求。",
    priority: "primary",
  },
  power: {
    type: "normative-standard",
    sourceTitle: "公路工程施工安全技术规范",
    version: "JTG F90-2015",
    clauseNumber: "4.3",
    summary: "临时用电应明确配电、防雨、防潮、接地和漏电保护等强制安全措施。",
    priority: "primary",
  },
  emergency: {
    type: "safety-risk-assessment",
    sourceTitle: "施工安全风险评估报告",
    locator: "应急资源与重大风险源章节",
    summary: "评估报告要求高处坠落、物体打击、触电事故具备明确响应流程和资源保障。",
    priority: "supporting",
  },
  acceptance: {
    type: "project-document",
    sourceTitle: "南京综合楼项目施工组织设计",
    locator: "验收与资料章节",
    summary: "验收资料应明确责任主体、复核流程和归档要求，避免只写原则性表述。",
    priority: "supporting",
  },
};

const draftRules: DraftRule[] = [
  {
    id: "scaffold-review-gap",
    title: "危大工程管理方式不符合要求",
    severity: "critical",
    matchers: ["普通分项工程管理", "脚手架", "24m"],
    reason: "脚手架搭设高度达到危大工程识别条件，不能按普通分项工程直接管理。",
    basis: "达到危大工程条件的脚手架工程应编制专项施工方案并履行审批程序。",
    suggestion: "将该外脚手架纳入危大工程管理，补充专项施工方案审批、交底和验收流程。",
    kernel: {
      engineSource: "rule",
      checkDomain: "procedure-compliance",
      checkItem: "危大工程等级识别与专项方案审批程序",
      outputScenario: "supervisor-formal-review",
      complianceCategory: "mandatory-clause",
      basisPriority: "primary",
      schemaVersion: "review-kernel-draft-1.0",
      basisReferences: [basisReferences.scaffold, basisReferences.acceptance],
      rectification: {
        requirement: "将外脚手架纳入危大工程管理，补充专项施工方案审批、交底和验收流程。",
        verificationStandard: "复核方案中是否明确危大等级、审批责任主体、监理审查节点和实施前交底记录。",
        deadline: "施工前完成整改并重新报审。",
        recheckProcess: "施工单位修订后提交监理复核，必要时同步安全管理资料归档。",
      },
    },
  },
  {
    id: "tower-crane-tether-gap",
    title: "塔吊附着固定方式存在重大风险",
    severity: "critical",
    matchers: ["铁丝", "临时拉结", "附着"],
    reason: "塔吊附着不得采用临时柔性材料替代专用附着装置，相关描述存在严重安全隐患。",
    basis: "塔吊附着装置应按产品说明书和专项方案设置，并保持可靠连接。",
    suggestion: "删除铁丝临时拉结表述，补充经计算复核的专用刚性附着装置及安装验收记录要求。",
    kernel: {
      engineSource: "rule",
      checkDomain: "professional-technical",
      checkItem: "起重机械附着装置可靠性校验",
      outputScenario: "supervisor-formal-review",
      complianceCategory: "mandatory-clause",
      basisPriority: "primary",
      schemaVersion: "review-kernel-draft-1.0",
      basisReferences: [basisReferences.lifting],
      rectification: {
        requirement: "补充专用刚性附着装置及安装验收记录，删除铁丝临时拉结做法。",
        verificationStandard: "核验附着节点构造、计算书、设备说明书、安装验收单和监理复核记录一致。",
        deadline: "塔吊附着施工前完成。",
        recheckProcess: "专项方案修订后由施工技术负责人审核，监理工程师复查附着验收资料。",
      },
    },
  },
  {
    id: "temporary-power-defect",
    title: "临时用电防护措施表述不确定",
    severity: "high",
    matchers: ["视现场积水情况", "防雨措施", "临时用电"],
    reason: "临时用电设施的防雨、防潮和漏电保护不应作为可选措施，应在方案中明确设置要求。",
    basis: "临时用电规范要求配电箱、开关箱采取防雨、防尘和防砸措施。",
    suggestion: "将防雨、防潮、防砸和漏电保护写为明确配置要求，不使用视情况决定等不确定表述。",
    kernel: {
      engineSource: "semantic",
      checkDomain: "preparation-content",
      checkItem: "安全保证措施针对性与临时用电防护",
      outputScenario: "contractor-self-check",
      complianceCategory: "general-norm",
      basisPriority: "primary",
      schemaVersion: "review-kernel-draft-1.0",
      basisReferences: [basisReferences.power],
      rectification: {
        requirement: "将防雨、防潮、防砸和漏电保护写为明确配置要求。",
        verificationStandard: "复核配电箱布置、防雨设施、接地保护、漏电保护参数和检查频次均有明确描述。",
        deadline: "雨季施工前完成方案修订。",
        recheckProcess: "施工单位提交临时用电专项措施，监理复核后纳入安全检查台账。",
      },
    },
  },
  {
    id: "emergency-response-gap",
    title: "应急处置缺少责任分工",
    severity: "medium",
    matchers: ["根据实际情况组织救援", "应急处置", "事故时"],
    reason: "应急处置表述过泛，缺少通讯录、救援路线、责任人和演练安排。",
    basis: "项目应急预案管理要求应明确组织机构、职责、响应流程和保障措施。",
    suggestion: "补充应急组织架构、岗位职责、联系人清单、救援路线、物资清单和演练计划。",
    kernel: {
      engineSource: "semantic",
      checkDomain: "preparation-content",
      checkItem: "应急预案体系完整性",
      outputScenario: "supervisor-formal-review",
      complianceCategory: "general-norm",
      basisPriority: "supporting",
      schemaVersion: "review-kernel-draft-1.0",
      basisReferences: [basisReferences.emergency, basisReferences.acceptance],
      rectification: {
        requirement: "补充应急组织、通讯录、救援路线、物资清单、演练计划和事故报告流程。",
        verificationStandard: "核验应急预案内容与安全风险评估报告及投标承诺一致，并明确责任人。",
        deadline: "开工前完成并组织交底。",
        recheckProcess: "监理复核应急预案附件和演练计划，纳入首次安全检查。",
      },
    },
  },
  {
    id: "temporary-power-placement-gap",
    title: "配电箱布置位置过近材料堆场",
    severity: "medium",
    matchers: ["材料堆场附近", "配电箱设置在材料堆场附近"],
    reason: "配电箱靠近材料堆场会增加碰撞、遮挡和防护不足风险。",
    basis: "临时用电设施布置应满足防护、通行和检修安全要求。",
    suggestion: "将配电箱移至通行明确且便于防护的位置，并设置隔离与警示。",
    kernel: {
      engineSource: "semantic",
      checkDomain: "implementation-consistency",
      checkItem: "临时用电设施布置与防护间距",
      outputScenario: "supervisor-formal-review",
      complianceCategory: "general-norm",
      basisPriority: "supporting",
      schemaVersion: "review-kernel-draft-1.0",
      basisReferences: [basisReferences.power],
      rectification: {
        requirement: "将配电箱移至更安全的位置，并增加隔离、警示与防护措施。",
        verificationStandard: "核验配电箱周边无堆载遮挡，通道和防护设施完整。",
        deadline: "临时用电方案修订时同步调整。",
        recheckProcess: "监理复核临电平面布置与现场安装位置一致。",
      },
    },
  },
  {
    id: "acceptance-loop-gap",
    title: "验收资料缺少责任主体和复核闭环",
    severity: "medium",
    matchers: ["投入使用前应完成验收", "验收资料由资料员统一归档"],
    reason: "验收资料表述过于原则化，未明确验收责任主体和复核闭环。",
    basis: "验收与归档类材料应明确责任主体、复核流程和归档要求。",
    suggestion: "补充验收责任人、复核节点、整改闭环和归档清单。",
    kernel: {
      engineSource: "semantic",
      checkDomain: "preparation-content",
      checkItem: "验收资料完整性与闭环要求",
      outputScenario: "supervisor-formal-review",
      complianceCategory: "general-norm",
      basisPriority: "supporting",
      schemaVersion: "review-kernel-draft-1.0",
      basisReferences: [basisReferences.acceptance],
      rectification: {
        requirement: "补充验收责任人、复核节点和归档清单。",
        verificationStandard: "复核方案是否明确验收责任主体、复核流程和归档要求。",
        deadline: "使用前完成资料修订。",
        recheckProcess: "监理复核验收单据与现场状态一致后归档。",
      },
    },
  },
];

function createParagraphDrafts(
  paragraph: DocumentParagraph,
): ReviewIssue[] {
  const sourceText = paragraph.text;
  const lower = sourceText.toLowerCase();

  return draftRules.flatMap((rule) => {
    const keyword = rule.matchers.find(
      (item) => sourceText.includes(item) || lower.includes(item.toLowerCase()),
    );
    if (!keyword) {
      return [];
    }

    const startOffset = sourceText.indexOf(keyword);
    const endOffset = startOffset + keyword.length;
    const issueId = `draft-${rule.id}-${paragraph.id}`;

    return [
      {
        id: issueId,
        source: "ai" as const,
        status: "pending" as const,
        severity: rule.severity,
        anchor: {
          paragraphId: paragraph.id,
          startOffset: startOffset >= 0 ? startOffset : 0,
          endOffset: startOffset >= 0 ? endOffset : Math.min(paragraph.text.length, keyword.length),
          text: paragraph.text.slice(
            startOffset >= 0 ? startOffset : 0,
            startOffset >= 0 ? endOffset : Math.min(paragraph.text.length, keyword.length),
          ) || keyword,
        },
        finding: {
          title: rule.title,
          reason: rule.reason,
          basis: rule.basis,
          suggestion: rule.suggestion,
        },
        resolution: {
          action: null,
          editedText: null,
          resolvedAt: null,
        },
        kernel: rule.kernel,
      },
    ];
  });
}

export function buildStructureDraftIssues(
  recoveredStructure: RecoveredDocumentStructure | undefined,
): ReviewIssue[] {
  if (!recoveredStructure || recoveredStructure.paragraphs.length === 0) {
    return [];
  }

  const generatedIssues: ReviewIssue[] = [];

  recoveredStructure.paragraphs.forEach((paragraph) => {
    generatedIssues.push(...createParagraphDrafts(paragraph));
  });

  const deduped = new Map<string, ReviewIssue>();
  generatedIssues.forEach((issue) => {
    const key = `${issue.finding.title}|${issue.anchor.paragraphId}|${issue.anchor.startOffset}`;
    if (!deduped.has(key)) {
      deduped.set(key, issue);
    }
  });

  return Array.from(deduped.values());
}

export function mergeRecoveredStructureIssues(
  existingIssues: ReviewIssue[],
  recoveredStructure: RecoveredDocumentStructure | undefined,
): ReviewIssue[] {
  const draftIssues = buildStructureDraftIssues(recoveredStructure);
  if (draftIssues.length === 0) {
    return existingIssues.map((issue) => ({ ...issue, anchor: { ...issue.anchor } }));
  }

  const mergedIssues = [...existingIssues, ...draftIssues];
  const deduped = new Map<string, ReviewIssue>();

  for (const issue of mergedIssues) {
    const key = `${issue.finding.title}|${issue.anchor.paragraphId}|${issue.anchor.startOffset}`;
    if (!deduped.has(key)) {
      deduped.set(key, issue);
    }
  }

  return Array.from(deduped.values());
}
