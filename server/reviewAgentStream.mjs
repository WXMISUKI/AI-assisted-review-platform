import { streamLlmConnectivity } from "./llmClient.mjs";
import { getSafeProviderStatus } from "./config.mjs";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeCount(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? Math.floor(numberValue) : 0;
}

function normalizeLabel(value, fallback) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function hasStructureContext(structureSummary = {}) {
  return Boolean(
    normalizeCount(structureSummary.sectionCount) ||
      normalizeCount(structureSummary.paragraphCount) ||
      normalizeLabel(structureSummary.currentSection, "") ||
      normalizeLabel(structureSummary.currentParagraphLabel, "") ||
      normalizeCount(structureSummary.currentParagraphIndex) ||
      normalizeCount(structureSummary.currentParagraphTotal),
  );
}

function buildStructureAwareIssueSummaries(stageType, structureSummary = {}) {
  const sectionCount = normalizeCount(structureSummary.sectionCount);
  const paragraphCount = normalizeCount(structureSummary.paragraphCount);
  const currentSection = normalizeLabel(structureSummary.currentSection, "OCR恢复结构");
  const currentParagraphLabel = normalizeLabel(
    structureSummary.currentParagraphLabel,
    currentSection,
  );
  const currentParagraphIndex = normalizeCount(structureSummary.currentParagraphIndex);
  const currentParagraphTotal = normalizeCount(structureSummary.currentParagraphTotal);

  switch (stageType) {
    case "structure-restoration":
      return paragraphCount > 0
        ? [
            `已恢复 ${sectionCount} 个章节、${paragraphCount} 个段落，当前章节：${currentSection}。`,
          ]
        : ["已建立结构恢复通道，等待恢复摘要。"];
    case "basis-binding":
      return paragraphCount > 0
        ? [
            `${currentParagraphLabel} 可作为后续依据绑定和锚点复核的来源${
              currentParagraphIndex && currentParagraphTotal
                ? `（段落 ${currentParagraphIndex}/${currentParagraphTotal}）`
                : ""
            }。`,
          ]
        : ["结构摘要已进入依据绑定阶段。"];
    case "review-analysis":
      return paragraphCount > 0
        ? [`当前结构包含 ${paragraphCount} 个段落，可继续推进分段审查。`]
        : ["结构摘要已进入审查分析阶段。"];
    case "result-packaging":
      return ["结构化审查准备已就绪，可进入结果包装。"];
    default:
      return [];
  }
}

function buildStructureAwareStage(stageType, structureSummary) {
  const sectionCount = normalizeCount(structureSummary?.sectionCount);
  const paragraphCount = normalizeCount(structureSummary?.paragraphCount);
  const currentSection = normalizeLabel(structureSummary?.currentSection, "OCR恢复结构");
  const currentParagraphLabel = normalizeLabel(
    structureSummary?.currentParagraphLabel,
    currentSection,
  );
  const currentParagraphIndex = normalizeCount(structureSummary?.currentParagraphIndex);
  const currentParagraphTotal = normalizeCount(structureSummary?.currentParagraphTotal);

  const paragraphTotal = paragraphCount || currentParagraphTotal || 1;
  const paragraphIndex =
    currentParagraphIndex || Math.max(1, Math.ceil(paragraphTotal * 0.35));

  const stageMap = {
    "structure-restoration": {
      type: "review.stage",
      stageId: "structure-restoration",
      stageType: "structure-restoration",
      title: "读取OCR恢复结构",
      detail: `已接收 ${sectionCount} 个章节、${paragraphCount} 个段落的结构摘要。`,
      progress: 24,
      agentKey: "structure-restoration",
      agentLabel: "文档结构恢复智能体",
      currentParagraphIndex: currentParagraphIndex || 1,
      currentParagraphTotal: paragraphTotal,
      currentParagraphLabel: currentParagraphLabel,
      currentSection,
      issueSummaries: buildStructureAwareIssueSummaries("structure-restoration", structureSummary),
    },
    "basis-binding": {
      type: "review.stage",
      stageId: "basis-binding",
      stageType: "basis-binding",
      title: "绑定审查依据",
      detail: "正在为恢复后的章节准备规范、危大工程和项目依据匹配入口。",
      progress: 46,
      agentKey: "construction-review",
      agentLabel: "施工方案审查智能体",
      currentParagraphIndex: paragraphIndex,
      currentParagraphTotal: paragraphTotal,
      currentParagraphLabel: currentParagraphLabel,
      currentSection,
      issueSummaries: buildStructureAwareIssueSummaries("basis-binding", structureSummary),
    },
    "review-analysis": {
      type: "review.stage",
      stageId: "review-analysis",
      stageType: "semantic-review",
      title: "准备审查分析",
      detail: "正在按恢复段落组织后续规则审查与语义审查输入。",
      progress: 72,
      agentKey: "construction-review",
      agentLabel: "施工方案审查智能体",
      currentParagraphIndex: Math.max(1, Math.ceil(paragraphTotal * 0.7)),
      currentParagraphTotal: paragraphTotal,
      currentParagraphLabel: currentParagraphLabel,
      currentSection,
      issueSummaries: buildStructureAwareIssueSummaries("review-analysis", structureSummary),
    },
    "result-packaging": {
      type: "review.stage",
      stageId: "result-packaging",
      stageType: "result-packaging",
      title: "审查准备完成",
      detail: "结构恢复摘要已就绪，后续可替换为真实审查结果包装。",
      progress: 100,
      agentKey: "report-generation",
      agentLabel: "审查报告生成智能体",
      currentParagraphIndex: paragraphTotal,
      currentParagraphTotal: paragraphTotal,
      currentParagraphLabel: currentParagraphLabel,
      currentSection,
      issueSummaries: buildStructureAwareIssueSummaries("result-packaging", structureSummary),
    },
  };

  return stageMap[stageType];
}

function createStructureAwareStages(structureSummary = {}) {
  const structureMode = hasStructureContext(structureSummary);

  if (!structureMode) {
    return [
      {
        type: "review.stage",
        stageId: "connect",
        title: "连接后端智能体",
        detail: "已建立本地 BFF SSE 通道。",
        progress: 10,
        issueSummaries: [],
      },
      {
        type: "review.stage",
        stageId: "prepare-model",
        title: "准备模型客户端",
        detail: "正在检查 OpenAI-compatible LLM 配置。",
        progress: 35,
        issueSummaries: [],
      },
      {
        type: "review.stage",
        stageId: "draft-issues",
        title: "生成审查事件",
        detail: "当前为确定性连接性事件，后续可替换为真实智能体输出。",
        progress: 70,
        issueSummaries: ["示例：危大工程识别事件已进入后端流式通道。"],
      },
    ];
  }

  return [
    buildStructureAwareStage("structure-restoration", structureSummary),
    buildStructureAwareStage("basis-binding", structureSummary),
    buildStructureAwareStage("review-analysis", structureSummary),
    buildStructureAwareStage("result-packaging", structureSummary),
  ].filter(Boolean);
}

function buildPreparationStructureSummary(structureSummary = {}) {
  return {
    sectionCount: normalizeCount(structureSummary.sectionCount),
    paragraphCount: normalizeCount(structureSummary.paragraphCount),
    currentSection: normalizeLabel(structureSummary.currentSection, ""),
    currentParagraphLabel: normalizeLabel(structureSummary.currentParagraphLabel, ""),
    currentParagraphIndex: normalizeCount(structureSummary.currentParagraphIndex) || undefined,
    currentParagraphTotal: normalizeCount(structureSummary.currentParagraphTotal) || undefined,
  };
}

function collectIssueSummaries(stages) {
  return Array.from(new Set(stages.flatMap((stage) => stage.issueSummaries ?? [])));
}

function buildPreparationPackagePayload(structureSummary, stages, completedAt) {
  const providerStatus = getSafeProviderStatus();
  return {
    packageId: `backend-sse-${Date.now()}`,
    source: "backend-sse",
    status: "ready",
    structureSummary: buildPreparationStructureSummary(structureSummary),
    stageEvents: stages,
    issueSummaries: collectIssueSummaries(stages),
    providerSummary: providerStatus.summary,
    message: "Structure-aware review preparation package completed.",
    completedAt,
  };
}

export async function writeReviewAgentStream(response, options = {}) {
  const send = (event, data) => {
    response.write(`event: ${event}\n`);
    response.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const structureSummary = options.structureSummary ?? {};
  const structureMode = hasStructureContext(structureSummary);

  send("review-event", {
    type: "review.connection",
    stageId: "connect",
    title: "连接后端智能体",
    detail: "已建立本地 BFF SSE 通道。",
    progress: 5,
    issueSummaries: [],
    providers: getSafeProviderStatus(),
    currentSection: normalizeLabel(structureSummary.currentSection, ""),
  });

  const stages = createStructureAwareStages(structureSummary);

  if (structureMode) {
    for (const stage of stages) {
      send("review-event", stage);
      await sleep(350);
    }

    const completedAt = new Date().toISOString();
    send("review-event", {
      type: "review.complete",
      stageId: "complete",
      title: "结构驱动审查准备完成",
      detail: "后端 SSE 已完成一次 OCR 结构摘要驱动的审查准备输出。",
      progress: 100,
      issueSummaries: ["可继续接入真实 LLM 审查与结构化问题生成。"],
      completedAt,
      preparationPackage: buildPreparationPackagePayload(structureSummary, stages, completedAt),
    });
    return;
  }

  for (const stage of stages) {
    send("review-event", stage);
    await sleep(350);
  }

  for await (const llmEvent of streamLlmConnectivity()) {
    send("review-event", {
      type: llmEvent.type,
      stageId: "llm-stream",
      title: "LLM 流式连通性",
      detail: llmEvent.delta || llmEvent.message,
      progress: 86,
      issueSummaries: [],
    });
  }

  send("review-event", {
    type: "review.complete",
    stageId: "complete",
    title: "连通性流式测试完成",
    detail: "后端 SSE 通道已完成一次测试输出。",
    progress: 100,
    issueSummaries: ["后续可将该事件合同映射到 ReviewStreamingStage。"],
    completedAt: new Date().toISOString(),
  });
}
