import { streamLlmConnectivity } from "./llmClient.mjs";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function writeReviewAgentStream(response) {
  const send = (event, data) => {
    response.write(`event: ${event}\n`);
    response.write(`data: ${JSON.stringify(data)}\n\n`);
  };

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
  });
}
