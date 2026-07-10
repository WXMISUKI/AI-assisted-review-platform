import type { DocumentParagraph, ReviewIssue } from "./reviewTypes";

export const documentParagraphs: DocumentParagraph[] = [
  {
    id: "p-001",
    section: "一、工程概况",
    text: "本工程为南京市某综合楼项目，地上十八层，地下两层，总建筑面积约46000平方米，施工周期计划为18个月。",
  },
  {
    id: "p-002",
    section: "二、脚手架工程",
    text: "外脚手架采用扣件式钢管脚手架，搭设高度24m，项目部计划按普通分项工程管理，现场技术员完成交底后即可实施搭设。",
  },
  {
    id: "p-003",
    section: "三、塔吊安装与附着",
    text: "塔吊附着位置根据现场进度灵活调整，局部区域可采用10号铁丝临时拉结固定，待主体结构施工完成后统一加固。",
  },
  {
    id: "p-004",
    section: "四、临时用电",
    text: "现场临时用电由专业电工负责，配电箱设置在材料堆场附近，雨季施工期间视现场积水情况决定是否增设防雨措施。",
  },
  {
    id: "p-005",
    section: "五、应急处置",
    text: "发生高处坠落、物体打击、触电等事故时，现场人员应及时报告项目经理，并根据实际情况组织救援。",
  },
  {
    id: "p-006",
    section: "六、验收与资料",
    text: "脚手架、模板支撑和临时用电设施投入使用前应完成验收，验收资料由资料员统一归档。",
  },
];

const now = "2026-07-09T09:00:00.000+08:00";

export const initialReviewIssues: ReviewIssue[] = [
  {
    id: "ISSUE-001",
    source: "ai",
    status: "pending",
    severity: "critical",
    anchor: {
      paragraphId: "p-002",
      startOffset: 16,
      endOffset: 46,
      text: "搭设高度24m，项目部计划按普通分项工程管理",
    },
    finding: {
      title: "危大工程管理方式不符合要求",
      reason: "脚手架搭设高度达到危大工程识别条件，不能按普通分项工程直接管理。",
      basis: "危大工程安全管理相关规定要求对达到条件的脚手架工程编制专项施工方案并履行审批程序。",
      suggestion: "搭设高度24m的外脚手架应纳入危大工程管理，编制专项施工方案并完成审批、交底和验收后实施。",
    },
    resolution: {
      action: null,
      editedText: null,
      resolvedAt: null,
    },
    kernel: {
      engineSource: "hybrid",
      checkDomain: "procedure-compliance",
      checkItem: "危大工程等级识别与专项方案审批程序",
      outputScenario: "supervisor-formal-review",
      complianceCategory: "mandatory-clause",
      basisPriority: "primary",
      schemaVersion: "review-kernel-2.1-mock",
      basisReferences: [
        {
          type: "normative-standard",
          sourceTitle: "公路水运危险性较大工程安全专项施工方案审查规程",
          version: "JT/T 1495-2024",
          clauseNumber: "附录 A-D / 第 6 章",
          summary: "达到危大或超危大范围的工程应按规定履行专项方案编审、审查和必要的专家论证程序。",
          priority: "primary",
        },
        {
          type: "project-document",
          sourceTitle: "南京综合楼项目施工组织设计",
          locator: "脚手架工程章节",
          summary: "项目文档将 24m 外脚手架描述为普通分项工程管理，与危大识别结果不一致。",
          priority: "supporting",
        },
      ],
      rectification: {
        requirement: "将 24m 外脚手架纳入危大工程管理，补充专项施工方案审批、交底和验收流程。",
        verificationStandard: "复核方案中是否明确危大等级、审批责任主体、监理审查节点和实施前交底记录。",
        deadline: "施工前完成整改并重新报审。",
        recheckProcess: "施工单位修订后提交监理复核，必要时同步安全管理资料归档。",
      },
    },
  },
  {
    id: "ISSUE-002",
    source: "ai",
    status: "pending",
    severity: "critical",
    anchor: {
      paragraphId: "p-003",
      startOffset: 24,
      endOffset: 39,
      text: "采用10号铁丝临时拉结固定",
    },
    finding: {
      title: "塔吊附着固定方式存在重大风险",
      reason: "塔吊附着不得采用铁丝等临时柔性材料替代专用附着装置，相关描述存在严重安全隐患。",
      basis: "建筑机械使用安全技术相关规范要求塔吊附着装置应按产品说明书和专项方案设置，并保持可靠连接。",
      suggestion: "局部区域应采用经计算复核的专用刚性附着装置，并按专项方案完成安装、验收和记录。",
    },
    resolution: {
      action: null,
      editedText: null,
      resolvedAt: null,
    },
    kernel: {
      engineSource: "rule",
      checkDomain: "professional-technical",
      checkItem: "起重机械附着装置可靠性校验",
      outputScenario: "supervisor-formal-review",
      complianceCategory: "mandatory-clause",
      basisPriority: "primary",
      schemaVersion: "review-kernel-2.1-mock",
      basisReferences: [
        {
          type: "normative-standard",
          sourceTitle: "公路工程施工安全技术规范",
          version: "JTG F90-2015",
          clauseNumber: "起重吊装及特种设备安全要求",
          summary: "起重机械安装、附着、验收和使用应采用可靠连接并满足专项方案和设备技术文件要求。",
          priority: "primary",
        },
        {
          type: "drawing",
          sourceTitle: "塔吊附着布置图",
          locator: "附着节点详图待补充",
          summary: "当前方案未提供刚性附着节点计算与构造图，无法支撑临时拉结做法。",
          priority: "supporting",
        },
      ],
      rectification: {
        requirement: "删除铁丝临时拉结表述，补充经计算复核的专用刚性附着装置及安装验收记录要求。",
        verificationStandard: "核验附着节点构造、计算书、设备说明书、安装验收单和监理复核记录一致。",
        deadline: "塔吊附着施工前完成。",
        recheckProcess: "专项方案修订后由施工技术负责人审核，监理工程师复查附着验收资料。",
      },
      expertReview: {
        points: ["附着节点受力与构造可靠性", "塔吊安装工况与现场主体结构匹配性"],
        expertQualification: "起重机械或结构专业高级职称专家参与复核。",
        participantRequirement: "施工、监理、设备安装单位和项目技术负责人应参加专项论证或复核会议。",
        conclusionHandling: "若结论为修改后通过，应按专家意见逐项修订并由专家组长确认。",
        modificationVerification: "对照专家意见清单逐项核验修订位置和计算附件。",
      },
    },
  },
  {
    id: "ISSUE-003",
    source: "ai",
    status: "pending",
    severity: "high",
    anchor: {
      paragraphId: "p-004",
      startOffset: 31,
      endOffset: 52,
      text: "视现场积水情况决定是否增设防雨措施",
    },
    finding: {
      title: "临时用电防雨措施表述不确定",
      reason: "临时用电设施的防雨、防潮和漏电保护不应作为可选措施，应在方案中明确设置要求。",
      basis: "施工现场临时用电安全技术相关规范要求配电箱、开关箱采取防雨、防尘和防砸措施。",
      suggestion: "雨季施工期间配电箱、开关箱应设置稳定可靠的防雨、防潮、防砸措施，并定期检查漏电保护装置。",
    },
    resolution: {
      action: null,
      editedText: null,
      resolvedAt: null,
    },
    kernel: {
      engineSource: "semantic",
      checkDomain: "preparation-content",
      checkItem: "安全保证措施针对性与临时用电防护",
      outputScenario: "contractor-self-check",
      complianceCategory: "general-norm",
      basisPriority: "primary",
      schemaVersion: "review-kernel-2.1-mock",
      basisReferences: [
        {
          type: "normative-standard",
          sourceTitle: "公路工程施工监理规范",
          version: "JTG G10-2016",
          clauseNumber: "4.2.1 / 5.3.2",
          summary: "监理审查应关注临时用电、安全技术措施和应急预案等内容是否满足工程建设强制性标准。",
          priority: "primary",
        },
        {
          type: "normative-standard",
          sourceTitle: "公路工程施工安全技术规范",
          version: "JTG F90-2015",
          clauseNumber: "4.3",
          summary: "临时用电应明确配电、防雨、防潮、接地和漏电保护等强制安全措施。",
          priority: "primary",
        },
      ],
      rectification: {
        requirement: "将防雨、防潮、防砸和漏电保护写为明确配置要求，不使用视情况决定等不确定表述。",
        verificationStandard: "复核配电箱布置、防雨设施、接地保护、漏电保护参数和检查频次均有明确描述。",
        deadline: "雨季施工前完成方案修订。",
        recheckProcess: "施工单位提交临时用电专项措施，监理复核后纳入安全检查台账。",
      },
    },
  },
  {
    id: "ISSUE-004",
    source: "manual",
    status: "pending",
    severity: "medium",
    anchor: {
      paragraphId: "p-005",
      startOffset: 35,
      endOffset: 49,
      text: "根据实际情况组织救援",
    },
    finding: {
      title: "应急处置缺少责任分工",
      reason: "人工复核发现应急处置表述过泛，缺少通讯录、救援路线、责任人和演练安排。",
      basis: "企业项目应急预案管理要求应明确组织机构、职责、响应流程和保障措施。",
      suggestion: "补充应急组织架构、岗位职责、联系人清单、救援路线、物资清单和演练计划。",
    },
    resolution: {
      action: null,
      editedText: null,
      resolvedAt: now,
    },
    kernel: {
      engineSource: "semantic",
      checkDomain: "preparation-content",
      checkItem: "应急预案体系完整性",
      outputScenario: "supervisor-formal-review",
      complianceCategory: "general-norm",
      basisPriority: "supporting",
      schemaVersion: "review-kernel-2.1-mock",
      basisReferences: [
        {
          type: "safety-risk-assessment",
          sourceTitle: "施工安全风险评估报告",
          locator: "应急资源与重大风险源章节",
          summary: "评估报告要求高处坠落、物体打击、触电事故具备明确响应流程和资源保障。",
          priority: "supporting",
        },
        {
          type: "bid-commitment",
          sourceTitle: "中标施工单位安全管理承诺",
          locator: "安全履约承诺条款",
          summary: "投标承诺明确项目部应建立事故应急联络、救援物资和演练制度，优先级高于通用招标要求。",
          priority: "project-overrides",
        },
      ],
      rectification: {
        requirement: "补充应急组织、通讯录、救援路线、物资清单、演练计划和事故报告流程。",
        verificationStandard: "核验应急预案内容与安全风险评估报告及投标承诺一致，并明确责任人。",
        deadline: "开工前完成并组织交底。",
        recheckProcess: "监理复核应急预案附件和演练计划，纳入首次安全检查。",
      },
    },
  },
];

export const mockHazardClassification = {
  level: "危大工程",
  requiresExpertReview: true,
  basis: "外脚手架高度 24m，且涉及塔吊附着和临时用电等高风险作业，需按专项方案审查内核触发程序核验。",
  relatedIssueIds: ["ISSUE-001", "ISSUE-002"],
};
