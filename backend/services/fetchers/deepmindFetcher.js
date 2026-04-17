import {
  buildLiveRawNewsItem,
  fetchHtml,
  fetchMetaDescription,
  stripTags,
  toAbsoluteUrl
} from "./shared.js";

const DEEPMIND_BLOG_URL = "https://deepmind.google/blog/";

export function parseDeepMindBlogHtml(html) {
  const articlePattern = /<article class="card card-blog[\s\S]*?<\/article>/g;
  const items = [];
  const seenUrls = new Set();

  for (const articleMatch of html.matchAll(articlePattern)) {
    const articleHtml = articleMatch[0];
    const href = (articleHtml.match(/href=(?:"|')?(\/blog\/[^"' >]+\/)/i) ?? [])[1];

    if (!href) {
      continue;
    }

    const sourceUrl = toAbsoluteUrl(href, DEEPMIND_BLOG_URL);

    if (seenUrls.has(sourceUrl)) {
      continue;
    }

    const title = stripTags(
      (articleHtml.match(/<(?:h2|h3)[^>]*card__title[^>]*>([\s\S]*?)<\/(?:h2|h3)>/i) ?? [])[1]
    );
    const publishedAt =
      stripTags((articleHtml.match(/<time[^>]*datetime="([^"]+)"/i) ?? [])[1]) ||
      stripTags((articleHtml.match(/<time[^>]*>([\s\S]*?)<\/time>/i) ?? [])[1]);
    const category = stripTags(
      (articleHtml.match(/<span class="text-caption meta__category">([\s\S]*?)<\/span>/i) ?? [])[1]
    );

    if (!title || !publishedAt) {
      continue;
    }

    items.push({
      sourceUrl,
      title,
      publishedAt,
      category
    });
    seenUrls.add(sourceUrl);
  }

  return items;
}

export async function fetchLatestDeepMindNews({ fetchImpl = globalThis.fetch, limit = 5 } = {}) {
  const html = await fetchHtml(DEEPMIND_BLOG_URL, fetchImpl);
  const cards = parseDeepMindBlogHtml(html).slice(0, limit);

  if (!cards.length) {
    throw new Error("Google DeepMind News 未解析到可用新闻。");
  }

  const enrichedCards = await Promise.all(
    cards.map(async (card) => {
      try {
        const summary = await fetchMetaDescription(card.sourceUrl, fetchImpl);
        return {
          ...card,
          summary
        };
      } catch {
        return card;
      }
    })
  );

  return enrichedCards.map((card) =>
    buildLiveRawNewsItem({
      sourceName: "Google DeepMind",
      sourceUrl: card.sourceUrl,
      title: card.title,
      summary: card.summary,
      publishedAt: card.publishedAt,
      category: card.category
    })
  );
}
