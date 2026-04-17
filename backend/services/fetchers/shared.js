import { createHash } from "node:crypto";

const DEFAULT_HEADERS = {
  "accept-language": "en-US,en;q=0.9,zh-CN;q=0.8",
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36"
};

export function decodeHtmlEntities(text = "") {
  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&mdash;/g, "-")
    .replace(/&ndash;/g, "-")
    .replace(/&ldquo;/g, "\"")
    .replace(/&rdquo;/g, "\"")
    .replace(/&lsquo;/g, "'")
    .replace(/&rsquo;/g, "'");
}

export function normalizeWhitespace(text = "") {
  return decodeHtmlEntities(text).replace(/\s+/g, " ").trim();
}

export function stripTags(html = "") {
  return normalizeWhitespace(html.replace(/<[^>]+>/g, " "));
}

export function toAbsoluteUrl(url, baseUrl) {
  return new URL(url, baseUrl).toString();
}

export function normalizeTextKey(text = "") {
  return normalizeWhitespace(text).toLowerCase();
}

export function parsePublishedAt(dateText) {
  const parsed = new Date(dateText);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`无法解析发布时间: ${dateText}`);
  }

  return parsed.toISOString();
}

export function buildRawNewsId(sourceName, sourceUrl) {
  const digest = createHash("sha1").update(`${sourceName}:${sourceUrl}`).digest("hex").slice(0, 12);
  return `raw-live-${digest}`;
}

export function buildLiveRawNewsItem({
  sourceName,
  sourceUrl,
  title,
  summary,
  publishedAt,
  category = ""
}) {
  const normalizedTitle = normalizeWhitespace(title);
  const normalizedSummary =
    normalizeWhitespace(summary) ||
    normalizeWhitespace(`${sourceName}${category ? ` ${category}` : ""} 最新动态：${normalizedTitle}`);
  const normalizedCategory = normalizeWhitespace(category);
  const content = normalizeWhitespace(
    [
      normalizedTitle,
      normalizedSummary,
      normalizedCategory ? `分类：${normalizedCategory}` : ""
    ]
      .filter(Boolean)
      .join("。")
  );

  return {
    id: buildRawNewsId(sourceName, sourceUrl),
    title: normalizedTitle,
    summary: normalizedSummary,
    content,
    sourceName,
    sourceType: "official",
    sourceUrl,
    publishedAt: parsePublishedAt(publishedAt),
    language: "en",
    region: "global"
  };
}

export async function fetchHtml(url, fetchImpl = globalThis.fetch) {
  if (typeof fetchImpl !== "function") {
    throw new Error("当前运行环境不支持 fetch，无法执行实时抓取。");
  }

  const response = await fetchImpl(url, {
    headers: DEFAULT_HEADERS
  });

  if (!response.ok) {
    throw new Error(`抓取失败: ${url} (${response.status})`);
  }

  return response.text();
}

export async function fetchMetaDescription(url, fetchImpl = globalThis.fetch) {
  const html = await fetchHtml(url, fetchImpl);
  const patterns = [
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["'][^>]*>/i,
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["'][^>]*>/i
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);

    if (match?.[1]) {
      return normalizeWhitespace(match[1]);
    }
  }

  return "";
}
