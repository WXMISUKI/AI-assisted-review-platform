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
  },
];
