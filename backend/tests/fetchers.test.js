import test from "node:test";
import assert from "node:assert/strict";

import { fetchLatestAnthropicNews, parseAnthropicNewsHtml } from "../services/fetchers/anthropicFetcher.js";
import { fetchLatestDeepMindNews, parseDeepMindBlogHtml } from "../services/fetchers/deepmindFetcher.js";

const anthropicHtml = `
  <a href="/news/claude-opus-4-7" class="FeaturedGrid-module__content">
    <h2>Introducing Claude Opus 4.7</h2>
    <div class="FeaturedGrid-module__meta">
      <span class="caption bold">Product</span>
      <time>Apr 16, 2026</time>
    </div>
    <p>Our latest Opus model brings stronger performance across coding and agents.</p>
  </a>
  <a href="/glasswing" class="FeaturedGrid-module__sideLink">
    <div class="FeaturedGrid-module__meta">
      <span class="caption bold">Announcements</span>
      <time>Apr 7, 2026</time>
    </div>
    <h4>Project Glasswing</h4>
    <p>A new initiative to secure the world&apos;s most critical software.</p>
  </a>
`;

const deepMindListingHtml = `
  <article class="card card-blog card--small_h card--is-link">
    <div class="card__inner">
      <a class="card__overlay-link" href=/blog/gemini-robotics-er-1-6/ tabindex=-1></a>
      <div class="card__content">
        <h3 class="heading-6 card__title">Gemini Robotics-ER 1.6: Powering real-world robotics tasks through enhanced embodied reasoning</h3>
        <div class="meta">
          <span class="text-caption"><time datetime="April 2026">April 2026</time></span>
          <span class="text-caption meta__category">Models</span>
        </div>
      </div>
    </div>
  </article>
  <article class="card card-blog card--small_h card--is-link">
    <div class="card__inner">
      <a class="card__overlay-link" href=/blog/protecting-people-from-harmful-manipulation/ tabindex=-1></a>
      <div class="card__content">
        <h3 class="heading-6 card__title">Protecting people from harmful manipulation</h3>
        <div class="meta">
          <span class="text-caption"><time datetime="March 2026">March 2026</time></span>
          <span class="text-caption meta__category">Responsibility</span>
        </div>
      </div>
    </div>
  </article>
`;

test("parseAnthropicNewsHtml 能提取标题、日期和摘要", () => {
  const items = parseAnthropicNewsHtml(anthropicHtml);

  assert.equal(items.length, 2);
  assert.equal(items[0].title, "Introducing Claude Opus 4.7");
  assert.equal(items[0].publishedAt, "Apr 16, 2026");
  assert.match(items[1].summary, /critical software/);
});

test("fetchLatestAnthropicNews 能输出统一 raw news 结构", async () => {
  const fetchImpl = async () => ({
    ok: true,
    status: 200,
    text: async () => anthropicHtml
  });
  const items = await fetchLatestAnthropicNews({ fetchImpl, limit: 2 });

  assert.equal(items.length, 2);
  assert.equal(items[0].sourceName, "Anthropic");
  assert.equal(items[0].sourceType, "official");
  assert.match(items[0].sourceUrl, /^https:\/\/www\.anthropic\.com\//);
});

test("parseDeepMindBlogHtml 能提取列表卡片", () => {
  const items = parseDeepMindBlogHtml(deepMindListingHtml);

  assert.equal(items.length, 2);
  assert.equal(items[0].title, "Gemini Robotics-ER 1.6: Powering real-world robotics tasks through enhanced embodied reasoning");
  assert.equal(items[0].publishedAt, "April 2026");
  assert.equal(items[1].category, "Responsibility");
});

test("fetchLatestDeepMindNews 会补抓文章描述", async () => {
  const responses = new Map([
    ["https://deepmind.google/blog/", deepMindListingHtml],
    [
      "https://deepmind.google/blog/gemini-robotics-er-1-6/",
      '<meta name="description" content="Gemini Robotics-ER 1.6 helps robots reason through complex tasks.">'
    ],
    [
      "https://deepmind.google/blog/protecting-people-from-harmful-manipulation/",
      '<meta property="og:description" content="New safeguards help protect people from harmful manipulation.">'
    ]
  ]);
  const fetchImpl = async (url) => ({
    ok: true,
    status: 200,
    text: async () => responses.get(String(url)) ?? ""
  });
  const items = await fetchLatestDeepMindNews({ fetchImpl, limit: 2 });

  assert.equal(items.length, 2);
  assert.equal(items[0].sourceName, "Google DeepMind");
  assert.match(items[0].summary, /robots reason through complex tasks/);
  assert.match(items[1].summary, /harmful manipulation/);
});
