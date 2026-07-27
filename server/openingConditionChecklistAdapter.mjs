import { parseDocxBuffer } from "./docxParser.mjs";

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
    labelKeywords: ["安全员", "项目管理", "管理人员", "特种作业"],
  });
  const equipmentIds = selectMasterDataIds(requiredMasterData, {
    type: "equipment",
    labelKeywords: ["汽车吊", "起重", "吊", "泵车"],
  });
  const approvalDocumentIds = selectMasterDataIds(requiredMasterData, {
    type: "system_document",
    labelKeywords: ["开工申请", "审批表", "签章", "备案"],
  });

  const masterDataIdsByItem = {
    "1-1-1": approvalDocumentIds,
    "1-1-2": personnelIds,
    "1-1-3": personnelIds,
    "1-2-6": equipmentIds,
  };

  const difyCheckItems = [
    ["1-1-1", "资料核查", "人员", "施工单位营业执照、资质证书、安全生产许可证、合同、安全协议、备案证明等资质报审记录齐全。★", true, false, ["施工单位营业执照", "资质证书", "安全生产许可证", "合同", "安全协议", "备案证明"], 3],
    ["1-1-2", "资料核查", "人员", "施工人员花名册、实名制等级及教育记录等资质报审记录齐全。", false, false, ["施工人员花名册", "实名制等级记录", "教育记录"], 4],
    ["1-1-3", "资料核查", "人员", "特种作业人员身份证、操作证等报审记录齐全。★", true, false, ["特种作业人员身份证", "操作证"], 5],
    ["1-1-4", "资料核查", "人员", "砼浇筑现场指挥、调度体系齐全。", false, false, ["砼浇筑现场指挥体系", "调度体系"], 6],
    ["1-2-5", "资料核查", "设备器具", "测量、检测、计量仪器标定证书等报审资料齐全。", false, false, ["测量、检测、计量仪器标定证书"], 7],
    ["1-2-6", "资料核查", "设备器具", "起重设备检测报告、特殊工种证件、租赁合同、安全协议等资料齐全。★", true, false, ["起重设备检测报告", "特殊工种证件", "租赁合同", "安全协议"], 8],
    ["1-2-7", "资料核查", "设备器具", "混凝土泵车行驶证、驾驶员驾驶证、车辆年检报告等资料齐全。", false, false, ["混凝土泵车行驶证", "驾驶员驾驶证", "车辆年检报告"], 9],
    ["1-3-8", "资料核查", "原材料", "混凝土生产厂家资质、生产能力核查记录及内部审批资料齐全。★", true, false, ["混凝土生产厂家资质", "生产能力核查记录", "内部审批资料"], 10],
    ["1-3-9", "资料核查", "原材料", "原材料及构配件厂家资质、产品合格证、取样复试报告等资料齐全。", false, false, ["厂家资质", "产品合格证", "取样复试报告"], 11],
    ["1-3-10", "资料核查", "原材料", "混凝土配合比验证报告等报审资料齐全。★", true, false, ["混凝土配合比验证报告"], 12],
    ["1-3-11", "资料核查", "原材料", "钢筋连接工艺评定资料齐全。", false, false, ["钢筋连接工艺评定资料"], 13],
    ["1-4-12", "资料核查", "方法", "专项施工方案评审记录、意见回复、审批流程及交底记录齐全。★", true, false, ["专项施工方案评审记录", "意见回复", "审批流程", "交底记录"], 14],
    ["1-4-13", "资料核查", "方法", "施工技术交底和安全技术交底记录齐全。★", true, false, ["施工技术交底", "安全技术交底记录"], 15],
    ["1-5-14", "资料核查", "环境", "按需提供管线交底记录。", false, true, ["管线交底记录"], 16],
    ["1-6-15", "资料核查", "许可", "渣土或泥浆外运合同等资料齐全。★", true, false, ["渣土外运合同", "泥浆外运合同"], 17],
    ["1-6-16", "资料核查", "许可", "按需提供渣土处置证办理手续。", false, true, ["渣土处置证", "渣土证手续"], 18],
    ["1-6-17", "资料核查", "许可", "涉路、涉水施工许可及交通组织方案审批资料齐全。★", true, false, ["涉路施工许可", "涉水施工许可", "交通组织方案审批"], 19],
    ["1-6-18", "资料核查", "许可", "管线绿卡及架空线监护手续齐全。★", true, false, ["管线绿卡", "架空线监护手续"], 20],
    ["1-7-19", "资料核查", "其他", "桩位轴线放样记录及报审记录齐全。", false, false, ["桩位轴线放样记录", "报审记录"], 21],
    ["1-7-20", "资料核查", "其他", "安全管理和质量保证体系制度、管理台账齐全。", false, false, ["安全管理体系制度", "质量保证体系制度", "管理台账"], 22],
    ["1-7-21", "资料核查", "其他", "隐蔽工程验收记录及影像资料齐全。★", true, false, ["隐蔽工程验收记录", "影像资料"], 23],
    ["1-7-22", "资料核查", "其他", "承台桩基检测报告及设计确认文件齐全。★", true, false, ["承台桩基检测报告", "设计确认文件"], 24],
  ];

  return difyCheckItems.map(([itemId, category, subCategory, content, isMandatory, isAsNeeded, materials, rowIndex]) => ({
    id: itemId,
    category,
    subCategory,
    name: content,
    required: Boolean(isMandatory),
    isAsNeeded: Boolean(isAsNeeded),
    expectedEvidenceHints: materials,
    basisVersionId,
    masterDataIds: masterDataIdsByItem[itemId] ?? [],
    rowIndex,
  }));
}

function isDocxChecklistObject(objectRef = {}) {
  const fileName = String(objectRef.fileName ?? "").toLowerCase();
  const contentType = String(objectRef.contentType ?? "").toLowerCase();
  return fileName.endsWith(".docx") || contentType.includes("wordprocessingml.document");
}

function splitTableRowText(text = "") {
  const match = String(text).match(/^表格：行(\d+)\s+([\s\S]+)$/);
  if (!match) {
    return null;
  }

  return {
    rowIndex: Number(match[1]),
    cells: match[2]
      .split("|")
      .map((cell) => cell.trim())
      .filter(Boolean),
  };
}

function normalizeMaterialName(value = "") {
  return value
    .replace(/[。；;，,、]+$/g, "")
    .replace(/^(需提供|提供|包括|含|附件|资料|材料)[:：]*/g, "")
    .trim();
}

function deriveMaterialsFromText(text = "") {
  const candidateText = String(text)
    .replace(/等(资料|报审资料|报审记录)?(齐全|完整)?[。.]?$/g, "")
    .replace(/[★*]/g, "");
  const parts = candidateText
    .split(/[、,，;；及和与]/)
    .map(normalizeMaterialName)
    .filter((part) => part.length >= 2 && part.length <= 60)
    .filter((part) => !/^(资料核查|现场核查|核查项目|类别|序号|内容|备注|是否)$/.test(part));

  return Array.from(new Set(parts)).slice(0, 20);
}

function pickChecklistContentCell(cells = []) {
  return [...cells]
    .filter((cell) => !/^(\d+|[一二三四五六七八九十]+)$/.test(cell))
    .filter((cell) => !/^(资料核查|现场核查|类别|序号|核查项目|核查内容|备注|是否|结果)$/.test(cell))
    .sort((left, right) => right.length - left.length)[0] ?? "";
}

function deriveItemId(cells = [], rowIndex = 0, sequence = 0) {
  const explicitId = cells.find((cell) => /^(\d+[-.])+\d+$/.test(cell) || /^\d+$/.test(cell));
  return explicitId ? explicitId.replace(/\./g, "-") : `docx-${rowIndex || sequence + 1}`;
}

function deriveSubCategory(cells = [], content = "") {
  const categoryIndex = cells.findIndex((cell) => cell.includes("资料核查"));
  if (categoryIndex >= 0) {
    const nextCell = cells[categoryIndex + 1];
    if (nextCell && nextCell.length <= 20 && !content.includes(nextCell)) {
      return nextCell;
    }
  }

  const known = ["人员", "设备器具", "设备", "原材料", "方法", "环境", "许可", "其他"];
  return known.find((item) => cells.includes(item) || content.includes(item)) ?? "";
}

export async function extractOpeningConditionChecklistDefinitionFromDocxBuffer(
  buffer,
  { basisVersionId = "", requiredMasterData = [] } = {},
) {
  const structure = await parseDocxBuffer(buffer);
  const rows = (structure.paragraphs ?? [])
    .filter((paragraph) => paragraph.blockType === "table_row")
    .map((paragraph) => splitTableRowText(paragraph.text))
    .filter(Boolean);
  const items = [];

  for (const row of rows) {
    const rowText = row.cells.join(" ");
    if (!rowText || rowText.includes("现场核查")) {
      continue;
    }
    if (!rowText.includes("资料核查") && !/(资料|报审|证书|记录|合同|方案|许可|台账|报告)/.test(rowText)) {
      continue;
    }
    if (/(核查项目|核查内容|检查内容|序号|类别)/.test(rowText) && rowText.length < 80) {
      continue;
    }

    const content = pickChecklistContentCell(row.cells);
    if (!content || content.length < 6) {
      continue;
    }

    const materials = deriveMaterialsFromText(content);
    const itemId = deriveItemId(row.cells, row.rowIndex, items.length);
    items.push({
      id: itemId,
      category: "资料核查",
      subCategory: deriveSubCategory(row.cells, content),
      name: content,
      required: content.includes("★"),
      isAsNeeded: content.includes("按需"),
      expectedEvidenceHints: materials.length > 0 ? materials : [content.replace(/[★*]/g, "").trim()],
      basisVersionId,
      masterDataIds: selectMasterDataIds(requiredMasterData, {
        type: content.includes("设备") || content.includes("仪器") || content.includes("泵车") ? "equipment" : "system_document",
        labelKeywords: materials,
      }),
      rowIndex: row.rowIndex,
    });
  }

  return items;
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
