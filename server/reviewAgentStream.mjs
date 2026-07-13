import { streamLlmConnectivity } from "./llmClient.mjs";
import { getSafeProviderStatus } from "./config.mjs";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createStructureAwareStages(structureSummary) {
  const sectionCount = Math.max(0, Number(structureSummary.sectionCount) || 0);
  const paragraphCount = Math.max(0, Number(structureSummary.paragraphCount) || 0);
  const currentSection = structureSummary.currentSection || "OCR恢复结构";
  const paragraphTotal = paragraphCount || 1;

  return [
    {
      type: "review.stage",
      stageId: "structure-restoration",
      stageType: "structure-restoration",
      title: "读取OCR恢复结构",
      detail: `已接收 ${sectionCount} 个章节、${paragraphCount} 个段落的结构摘要。`,
      progress: 24,
      agentKey: "structure-restoration",
      agentLabel: "文档结构恢复智能体",
      currentParagraphIndex: 1,
      currentParagraphTotal: paragraphTotal,
      currentParagraphLabel: currentSection,
      currentSection,
      issueSummaries: [],
    },
    {
      type: "review.stage",
      stageId: "basis-binding",
      stageType: "basis-binding",
      title: "绑定审查依据",
      detail: "正在为恢复后的章节准备规范、危大工程和项目依据匹配入口。",
      progress: 46,
      agentKey: "construction-review",
      agentLabel: "施工方案审查智能体",
      currentParagraphIndex: Math.max(1, Math.ceil(paragraphTotal * 0.35)),
      currentParagraphTotal: paragraphTotal,
      currentParagraphLabel: currentSection,
      currentSection,
      issueSummaries: ["OCR结构已进入审查准备流，等待真实依据检索接入。"],
    },
    {
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
      currentParagraphLabel: currentSection,
      currentSection,
      issueSummaries: ["结构化段落已可作为后续问题锚点来源。"],
    },
    {
      type: "review.stage",
      stageId: "result-packaging",
      stageType: "result-packaging",
      title: "审查准备完成",
      detail: "结构恢复摘要已完成流式准备，后续可替换为真实智能体审查结果。",
      progress: 100,
      agentKey: "report-generation",
      agentLabel: "审查报告生成智能体",
      currentParagraphIndex: paragraphTotal,
      currentParagraphTotal: paragraphTotal,
      currentParagraphLabel: currentSection,
      currentSection,
      issueSummaries: ["审查工作台可以基于OCR恢复结构打开。"],
    },
  ];
}

export async function writeReviewAgentStream(response, options = {}) {
  const send = (event, data) => {
    response.write(`event: ${event}\n`);
    response.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  send("review-event", {
    type: "review.connection",
    stageId: "connect",
    title: "连接后端智能体",
    detail: "已建立本地 BFF SSE 通道。",
    progress: 5,
    issueSummaries: [],
    providers: getSafeProviderStatus(),
  });

  if (options.structureSummary?.paragraphCount) {
    for (const stage of createStructureAwareStages(options.structureSummary)) {
      send("review-event", stage);
      await sleep(350);
    }

    send("review-event", {
      type: "review.complete",
      stageId: "complete",
      title: "结构驱动审查准备完成",
      detail: "后端 SSE 已完成一次 OCR 结构摘要驱动的审查准备输出。",
      progress: 100,
      issueSummaries: ["可继续接入真实 LLM 审查与结构化问题生成。"],
      completedAt: new Date().toISOString(),
    });
    return;
  }

  const stages = [
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
      detail: "当前为确定性连通性事件，后续可替换为真实智能体输出。",
      progress: 70,
      issueSummaries: ["示例：危大工程识别事件已进入后端流式通道。"],
    },
  ];

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
