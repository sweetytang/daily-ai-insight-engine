import { extractionPrompt } from "../../models/promptTemplates.js";
import { buildInsightFromMetadata } from "../../utils/analysis.js";
import { createStructuredJsonResponse } from "./openaiClient.js";
import { extractionSchema } from "./schemas.js";

async function mapWithConcurrency(items, worker, concurrency = 3) {
  const results = new Array(items.length);
  let cursor = 0;

  async function runNext() {
    if (cursor >= items.length) {
      return;
    }

    const currentIndex = cursor;
    cursor += 1;
    results[currentIndex] = await worker(items[currentIndex], currentIndex);
    await runNext();
  }

  const taskCount = Math.min(concurrency, items.length);
  await Promise.all(Array.from({ length: taskCount }, () => runNext()));

  return results;
}

function buildExtractionPrompt(item, reportDate) {
  return [
    `报告日期：${reportDate}`,
    `标题：${item.title}`,
    `摘要：${item.summary}`,
    `正文：${item.content}`,
    `来源：${item.sourceName}（${item.sourceType}）`,
    `发布时间：${item.publishedAt}`,
    `语言与地区：${item.language} / ${item.region}`,
    "请基于以上单条新闻输出 JSON。"
  ].join("\n");
}

export async function extractInsightWithLlm(item, reportDate) {
  const metadata = await createStructuredJsonResponse({
    schemaName: "news_extraction",
    schema: extractionSchema,
    systemPrompt: extractionPrompt,
    userPrompt: buildExtractionPrompt(item, reportDate),
    maxOutputTokens: 900
  });

  return buildInsightFromMetadata(item, reportDate, metadata, {
    analysisMode: "llm"
  });
}

export async function extractInsightsWithLlm(items, reportDate) {
  return mapWithConcurrency(
    items,
    async (item, index) => {
      try {
        return await extractInsightWithLlm(item, reportDate);
      } catch (error) {
        throw new Error(
          `方案 B 在第 ${index + 1} 条新闻抽取时失败：${error instanceof Error ? error.message : "未知错误"}`
        );
      }
    },
    3
  );
}
