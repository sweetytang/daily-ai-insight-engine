import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";

import { env } from "../../config/env.js";

let cachedResolvedModel = null;
const chatModelCache = new Map();

function createStatusError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function sanitizeJsonText(input) {
  return input.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
}

function getModelsEndpoint() {
  const baseUrl = env.openaiBaseUrl?.trim();

  if (!baseUrl) {
    return "https://api.openai.com/v1/models";
  }

  return `${baseUrl.replace(/\/+$/, "")}/models`;
}

function buildMessages(systemPrompt, userPrompt) {
  return [new SystemMessage(systemPrompt), new HumanMessage(userPrompt)];
}

function extractMessageText(message) {
  const content = message?.content;

  if (typeof content === "string") {
    return content;
  }

  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .map((part) => {
      if (typeof part === "string") {
        return part;
      }

      return typeof part?.text === "string" ? part.text : "";
    })
    .join("");
}

function pickFallbackModel(modelIds) {
  if (!modelIds.length) {
    return env.openaiModel;
  }

  if (modelIds.includes(env.openaiModel)) {
    return env.openaiModel;
  }

  return (
    modelIds.find((modelId) => ["gpt-4.1-mini", "gpt-4o-mini", "gpt-4o", "deepseek-chat", "deepseek-reasoner"].includes(modelId)) ??
    modelIds[0]
  );
}

async function fetchAvailableModelIds() {
  const response = await fetch(getModelsEndpoint(), {
    headers: {
      Authorization: `Bearer ${env.openaiApiKey}`
    }
  });

  if (!response.ok) {
    throw new Error(`模型列表获取失败：HTTP ${response.status}`);
  }

  const payload = await response.json();
  return Array.isArray(payload.data) ? payload.data.map((item) => item.id).filter(Boolean) : [];
}

export function ensureOpenAiConfigured() {
  if (!env.openaiApiKey) {
    throw createStatusError("方案 B 需要 OPENAI_API_KEY，当前环境未配置。", 400);
  }
}

async function resolveModelName() {
  ensureOpenAiConfigured();

  if (cachedResolvedModel) {
    return cachedResolvedModel;
  }

  try {
    cachedResolvedModel = pickFallbackModel(await fetchAvailableModelIds());
  } catch {
    cachedResolvedModel = env.openaiModel;
  }

  return cachedResolvedModel;
}

async function getChatModel() {
  const modelName = await resolveModelName();

  if (!chatModelCache.has(modelName)) {
    chatModelCache.set(
      modelName,
      new ChatOpenAI({
        apiKey: env.openaiApiKey,
        model: modelName,
        temperature: 0,
        maxRetries: 1,
        useResponsesApi: false,
        configuration: env.openaiBaseUrl
          ? {
              baseURL: env.openaiBaseUrl
            }
          : undefined
      })
    );
  }

  return chatModelCache.get(modelName);
}

async function invokeWithStructuredOutput({
  schemaName,
  schema,
  systemPrompt,
  userPrompt,
  method,
  strict
}) {
  const model = await getChatModel();
  const structuredModel = model.withStructuredOutput(schema, {
    name: schemaName,
    method,
    strict
  });

  return structuredModel.invoke(buildMessages(systemPrompt, userPrompt));
}

async function invokeWithPromptOnly({ systemPrompt, userPrompt }) {
  const model = await getChatModel();
  const response = await model.invoke(
    buildMessages(
      `${systemPrompt}\n你必须只返回 JSON，不要输出 Markdown 代码块，不要添加任何额外解释。`,
      `${userPrompt}\n请严格遵守既定 JSON Schema，字段齐全，不能输出额外文本。`
    )
  );

  return JSON.parse(sanitizeJsonText(extractMessageText(response)));
}

export async function createStructuredJsonResponse({
  schemaName,
  schema,
  systemPrompt,
  userPrompt
}) {
  const attempts = [
    () =>
      invokeWithStructuredOutput({
        schemaName,
        schema,
        systemPrompt,
        userPrompt,
        method: "jsonSchema",
        strict: true
      }),
    () =>
      invokeWithStructuredOutput({
        schemaName,
        schema,
        systemPrompt,
        userPrompt,
        method: "functionCalling",
        strict: true
      }),
    () =>
      invokeWithStructuredOutput({
        schemaName,
        schema,
        systemPrompt,
        userPrompt,
        method: "jsonMode"
      }),
    () =>
      invokeWithPromptOnly({
        systemPrompt,
        userPrompt
      })
  ];
  let lastError = null;

  for (const attempt of attempts) {
    try {
      return await attempt();
    } catch (error) {
      lastError = error;
    }
  }

  throw createStatusError(
    `方案 B 调用失败：${lastError instanceof Error ? lastError.message : "未知错误"}`,
    502
  );
}
