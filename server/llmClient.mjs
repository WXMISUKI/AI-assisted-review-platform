import OpenAI from "openai";
import { config } from "./config.mjs";

export function createOpenAIClient() {
  if (!config.openai.apiKey || !config.openai.model) {
    return null;
  }

  return new OpenAI({
    apiKey: config.openai.apiKey,
    baseURL: config.openai.baseURL || undefined,
  });
}

function getMissingOpenAIConfig() {
  return [
    !config.openai.apiKey ? "OPENAI_API_KEY" : "",
    !config.openai.model ? "OPENAI_MODEL" : "",
  ].filter(Boolean);
}

export async function checkLlmConnectivity() {
  const client = createOpenAIClient();
  if (!client) {
    const missing = getMissingOpenAIConfig();
    return {
      ok: false,
      status: "not_configured",
      configured: false,
      message: `Missing backend config: ${missing.join(", ") || "unknown"}.`,
    };
  }

  try {
    const completion = await client.chat.completions.create({
      model: config.openai.model,
      messages: [
        {
          role: "system",
          content: "You are a connectivity checker. Reply with a short Chinese confirmation.",
        },
        {
          role: "user",
          content: "请返回一句不超过20字的连通性确认。",
        },
      ],
      temperature: 0,
      max_tokens: 256,
    });

    return {
      ok: true,
      status: "ok",
      configured: true,
      model: config.openai.model,
      hasBaseURL: Boolean(config.openai.baseURL),
      preview: completion.choices?.[0]?.message?.content || "",
    };
  } catch (error) {
    return {
      ok: false,
      status: "failed",
      configured: true,
      model: config.openai.model,
      hasBaseURL: Boolean(config.openai.baseURL),
      message: error instanceof Error ? error.message : "Unknown LLM connectivity error.",
    };
  }
}

export async function* streamLlmConnectivity() {
  const client = createOpenAIClient();
  if (!client) {
    const missing = getMissingOpenAIConfig();
    yield {
      type: "llm.error",
      message: `Missing backend config: ${missing.join(", ") || "unknown"}.`,
    };
    return;
  }

  try {
    const stream = await client.chat.completions.create({
      model: config.openai.model,
      messages: [
        {
          role: "system",
          content: "You emit concise status text for a construction review connectivity test.",
        },
        {
          role: "user",
          content: "用三小句说明施工方案审查智能体连通正常。",
        },
      ],
      temperature: 0,
      max_tokens: 256,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) {
        yield {
          type: "llm.delta",
          delta,
        };
      }
    }
  } catch (error) {
    yield {
      type: "llm.error",
      message: error instanceof Error ? error.message : "Unknown LLM stream error.",
    };
  }
}
