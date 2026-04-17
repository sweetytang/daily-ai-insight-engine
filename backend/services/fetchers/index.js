import { fetchLatestAnthropicNews } from "./anthropicFetcher.js";
import { fetchLatestDeepMindNews } from "./deepmindFetcher.js";
import { normalizeTextKey } from "./shared.js";

function dedupeRawItems(items) {
  const deduped = [];
  const seenKeys = new Set();

  for (const item of items) {
    const uniqueKey = `${item.sourceUrl}|${normalizeTextKey(item.title)}`;

    if (seenKeys.has(uniqueKey)) {
      continue;
    }

    deduped.push(item);
    seenKeys.add(uniqueKey);
  }

  return deduped;
}

export function buildSeedIngestion(rawItems = []) {
  return {
    mode: "seed",
    sources: ["本地样例数据"],
    failedSources: [],
    fetchedCount: rawItems.length,
    refreshedAt: new Date().toISOString()
  };
}

export async function fetchLiveNewsItems({ fetchImpl = globalThis.fetch } = {}) {
  const tasks = [
    {
      sourceName: "Anthropic News",
      runner: () => fetchLatestAnthropicNews({ fetchImpl })
    },
    {
      sourceName: "Google DeepMind News",
      runner: () => fetchLatestDeepMindNews({ fetchImpl })
    }
  ];
  const settled = await Promise.allSettled(tasks.map((task) => task.runner()));
  const collectedItems = [];
  const sources = [];
  const failedSources = [];

  settled.forEach((result, index) => {
    const task = tasks[index];

    if (result.status === "fulfilled" && result.value.length) {
      collectedItems.push(...result.value);
      sources.push(task.sourceName);
      return;
    }

    failedSources.push(task.sourceName);
  });

  const rawItems = dedupeRawItems(collectedItems).sort(
    (left, right) => new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime()
  );

  if (!rawItems.length) {
    throw new Error("实时抓取未获取到可用新闻，请稍后重试。");
  }

  return {
    rawItems,
    ingestion: {
      mode: "live",
      sources,
      failedSources,
      fetchedCount: rawItems.length,
      refreshedAt: new Date().toISOString()
    }
  };
}
