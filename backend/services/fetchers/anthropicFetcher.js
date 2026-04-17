import {
  buildLiveRawNewsItem,
  fetchHtml,
  stripTags,
  toAbsoluteUrl
} from "./shared.js";

const ANTHROPIC_NEWS_URL = "https://www.anthropic.com/news";

export function parseAnthropicNewsHtml(html) {
  const pattern =
    /<a href="([^"]+)"[^>]*class="(?:FeaturedGrid[^"]*content|FeaturedGrid[^"]*sideLink)[^"]*"[^>]*>([\s\S]{0,1800}?)<\/a>/g;
  const items = [];
  const seenUrls = new Set();

  for (const match of html.matchAll(pattern)) {
    const sourceUrl = toAbsoluteUrl(match[1], ANTHROPIC_NEWS_URL);

    if (seenUrls.has(sourceUrl)) {
      continue;
    }

    const body = match[2];
    const title = stripTags((body.match(/<(?:h2|h4)[^>]*>([\s\S]*?)<\/(?:h2|h4)>/i) ?? [])[1]);
    const publishedAt = stripTags((body.match(/<time[^>]*>([\s\S]*?)<\/time>/i) ?? [])[1]);
    const summary = stripTags((body.match(/<p[^>]*>([\s\S]*?)<\/p>/i) ?? [])[1]);
    const category = stripTags((body.match(/<span class="caption bold">([\s\S]*?)<\/span>/i) ?? [])[1]);

    if (!title || !publishedAt) {
      continue;
    }

    items.push({
      title,
      summary,
      publishedAt,
      sourceUrl,
      category
    });
    seenUrls.add(sourceUrl);
  }

  return items;
}

export async function fetchLatestAnthropicNews({ fetchImpl = globalThis.fetch, limit = 5 } = {}) {
  const html = await fetchHtml(ANTHROPIC_NEWS_URL, fetchImpl);
  const cards = parseAnthropicNewsHtml(html).slice(0, limit);

  if (!cards.length) {
    throw new Error("Anthropic News 未解析到可用新闻。");
  }

  return cards.map((card) =>
    buildLiveRawNewsItem({
      sourceName: "Anthropic",
      sourceUrl: card.sourceUrl,
      title: card.title,
      summary: card.summary,
      publishedAt: card.publishedAt,
      category: card.category
    })
  );
}
