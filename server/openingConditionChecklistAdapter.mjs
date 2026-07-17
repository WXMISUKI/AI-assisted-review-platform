function normalizeLookupValue(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function containsAnyKeyword(text, keywords = []) {
  const normalizedText = normalizeLookupValue(text);
  return keywords.some((keyword) => normalizedText.includes(normalizeLookupValue(keyword)));
}

function selectMasterDataIds(requiredMasterData = [], { type, labelKeywords = [], max = 3 }) {
  return requiredMasterData
    .filter((item) => item?.type === type)
    .filter((item) => labelKeywords.length === 0 || containsAnyKeyword(item.label, labelKeywords))
    .slice(0, max)
    .map((item) => item.id);
}

function buildPierCapChecklistTemplate({ basisVersionId = "", requiredMasterData = [] } = {}) {
  const personnelIds = selectMasterDataIds(requiredMasterData, {
    type: "personnel",
    labelKeywords: ["安全员", "项目管理", "管理人员"],
  });
  const equipmentIds = selectMasterDataIds(requiredMasterData, {
    type: "equipment",
    labelKeywords: ["汽车吊", "起重", "吊"],
  });
  const approvalDocumentIds = selectMasterDataIds(requiredMasterData, {
    type: "system_document",
    labelKeywords: ["开工申请", "审批表", "签章"],
  });

  return [
    {
      id: "oc-check-001",
      category: "资料核查",
      subCategory: "人员",
      name: "项目管理人员及专职安全员资格证书",
      required: true,
      expectedEvidenceHints: ["专职安全员", "项目管理人员", "资格证书"],
      basisVersionId,
      masterDataIds: personnelIds,
    },
    {
      id: "oc-check-002",
      category: "资料核查",
      subCategory: "设备器具",
      name: "进场起重设备检验报告和有效期",
      required: true,
      expectedEvidenceHints: ["汽车吊", "起重设备", "检验报告", "有效期"],
      basisVersionId,
      masterDataIds: equipmentIds,
    },
    {
      id: "oc-check-003",
      category: "资料核查",
      subCategory: "审批签章",
      name: "开工申请审批表签章和签字日期",
      required: true,
      expectedEvidenceHints: ["开工申请", "审批表", "签章", "签字", "日期"],
      basisVersionId,
      masterDataIds: approvalDocumentIds,
      visualAssertions: [
        {
          type: "stamp",
          status: "uncertain",
          confidence: "low",
          requiresHumanReview: true,
          note: "签章存在性和清晰度需要人工确认。",
        },
        {
          type: "signature",
          status: "uncertain",
          confidence: "low",
          requiresHumanReview: true,
          note: "签字存在性和清晰度需要人工确认。",
        },
        {
          type: "handwritten_date",
          status: "uncertain",
          confidence: "low",
          requiresHumanReview: true,
          note: "手写日期属于低置信视觉断言，需要人工确认。",
        },
      ],
    },
    {
      id: "oc-check-004",
      category: "资料核查",
      subCategory: "依据完整性",
      name: "核查依据覆盖资料、人员、设备和制度边界",
      required: false,
      expectedEvidenceHints: ["核查表", "规范", "制度", "依据"],
      basisVersionId,
      masterDataIds: [],
    },
    {
      id: "oc-check-005",
      category: "现场核查",
      subCategory: "现场条件",
      name: "现场临边防护和应急物资布设",
      required: false,
      expectedEvidenceHints: ["现场条件", "临边防护", "应急物资"],
      basisVersionId,
      masterDataIds: [],
      scopeStatus: "out_of_scope",
    },
  ];
}

const pilotChecklistTemplates = [
  {
    id: "pier-cap-opening-condition-checklist",
    match(objectRef = {}) {
      return containsAnyKeyword(objectRef.fileName, ["承台施工条件核查", "承台施工开工条件", "承台施工条件核查表"]);
    },
    build(context) {
      return buildPierCapChecklistTemplate(context);
    },
  },
];

export function deriveOpeningConditionPilotChecklistDefinition({
  checklistObject,
  basisVersionId = "",
  requiredMasterData = [],
} = {}) {
  if (!checklistObject?.fileName) {
    return {
      resolution: "manual_definition_required",
      checklistItems: [],
    };
  }

  const matchedTemplate = pilotChecklistTemplates.find((template) => template.match(checklistObject));
  if (!matchedTemplate) {
    return {
      resolution: "manual_definition_required",
      checklistItems: [],
    };
  }

  return {
    resolution: "derived_from_template",
    templateId: matchedTemplate.id,
    checklistItems: matchedTemplate.build({
      checklistObject,
      basisVersionId,
      requiredMasterData,
    }),
  };
}
