import {
  COMPANY_KEYWORDS,
  ENTITY_WEIGHTS,
  EVENT_TYPE_LABELS,
  SOURCE_WEIGHTS,
  THEME_KEYWORDS,
  THEME_LABELS,
  THEME_WEIGHTS
} from "../../common/constants/analysis.js";
import { clamp, daysBetween, uniqueItems } from "../../common/utils/report.js";

const eventTypeRules = {
  funding: ["funding", "raises", "raise", "valuation", "融资", "领投", "post-money"],
  infrastructure: ["compute", "tpu", "capacity", "gigawatts", "算力", "基础设施"],
  partnership: ["partnership", "collaborate", "collaboration", "合作"],
  safety: ["safety", "alignment", "manipulation", "fellowship", "治理", "robustness"],
  model_release: ["introducing", "release", "model", "model card", "发布", "gpt", "gemini", "gemma", "tts"],
  ecosystem: ["retiring", "retire", "transition", "sidebar", "更新", "生态"]
};

const negativeSignals = ["skepticism", "second thoughts", "retiring", "risk", "pressure", "挑战", "波动"];
const positiveSignals = ["introducing", "launch", "raises", "growth", "发布", "完成融资", "上线", "expands"];
const validThemes = new Set(Object.keys(THEME_KEYWORDS));
const validEventTypes = new Set(Object.keys(eventTypeRules));
const validSentimentLabels = new Set(["positive", "neutral", "watch"]);

export const SENTIMENT_SCORE_BY_LABEL = {
  positive: 0.48,
  neutral: 0.12,
  watch: -0.25
};

function countMatches(text, keywords) {
  return keywords.reduce((total, keyword) => total + (text.includes(keyword) ? 1 : 0), 0);
}

function collectTextFragments(value) {
  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized ? [normalized] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap(collectTextFragments);
  }

  if (value && typeof value === "object") {
    return Object.values(value).flatMap(collectTextFragments);
  }

  return [];
}

function normalizeStringArray(value, limit) {
  return uniqueItems(collectTextFragments(value)).slice(0, limit);
}

function normalizeTextValue(value) {
  return collectTextFragments(value).join("；");
}

export function normalizeRawNews(item) {
  return {
    ...item,
    title: item.title.trim(),
    summary: item.summary.trim(),
    content: item.content.trim(),
    searchableText: `${item.title} ${item.summary} ${item.content}`.toLowerCase()
  };
}

export function detectCompanies(text) {
  return uniqueItems(
    Object.entries(COMPANY_KEYWORDS)
      .filter(([, keywords]) => keywords.some((keyword) => text.includes(keyword)))
      .map(([company]) => company)
  );
}

export function detectTheme(text) {
  const themeScores = Object.entries(THEME_KEYWORDS).map(([theme, keywords]) => ({
    theme,
    score: countMatches(text, keywords)
  }));

  themeScores.sort((left, right) => right.score - left.score);

  const primaryTheme = themeScores[0]?.score ? themeScores[0].theme : "model";
  const secondaryThemes = themeScores
    .filter(({ score, theme }) => score > 0 && theme !== primaryTheme)
    .slice(0, 3)
    .map(({ theme }) => theme);

  return { primaryTheme, secondaryThemes };
}

export function detectEventType(text) {
  const ranked = Object.entries(eventTypeRules)
    .map(([eventType, keywords]) => ({
      eventType,
      score: countMatches(text, keywords)
    }))
    .sort((left, right) => right.score - left.score);

  return ranked[0]?.score ? ranked[0].eventType : "ecosystem";
}

export function detectSentiment(text, sourceType) {
  const negativeCount = countMatches(text, negativeSignals);
  const positiveCount = countMatches(text, positiveSignals);

  if (negativeCount > positiveCount) {
    return {
      sentimentLabel: "watch",
      sentimentScore: -0.25
    };
  }

  if (sourceType === "official" && positiveCount > 0) {
    return {
      sentimentLabel: "positive",
      sentimentScore: 0.48
    };
  }

  return {
    sentimentLabel: "neutral",
    sentimentScore: SENTIMENT_SCORE_BY_LABEL.neutral
  };
}

export function normalizeTheme(value) {
  return validThemes.has(value) ? value : "model";
}

export function normalizeEventType(value) {
  return validEventTypes.has(value) ? value : "ecosystem";
}

export function normalizeSentimentLabel(value) {
  return validSentimentLabels.has(value) ? value : "neutral";
}

export function buildRiskTags(primaryTheme, eventType, text) {
  const risks = [];

  if (primaryTheme === "infrastructure") {
    risks.push("算力供给向头部集中", "资本开支持续抬升");
  }

  if (primaryTheme === "capital") {
    risks.push("估值抬升过快", "资本回报周期拉长");
  }

  if (primaryTheme === "safety") {
    risks.push("治理要求持续提高");
  }

  if (primaryTheme === "enterprise") {
    risks.push("行业交付复杂度上升");
  }

  if (primaryTheme === "open_source") {
    risks.push("模型同质化加剧");
  }

  if (text.includes("retiring") || text.includes("退役")) {
    risks.push("用户迁移成本");
  }

  if (eventType === "funding") {
    risks.push("高估值带来执行压力");
  }

  return uniqueItems(risks).slice(0, 4);
}

export function buildOpportunityTags(primaryTheme, eventType, text) {
  const opportunities = [];

  if (primaryTheme === "infrastructure") {
    opportunities.push("算力平台与云服务需求提升");
  }

  if (primaryTheme === "capital") {
    opportunities.push("头部厂商扩张窗口打开");
  }

  if (primaryTheme === "model" || primaryTheme === "multimodal") {
    opportunities.push("多模态应用创新加速");
  }

  if (primaryTheme === "enterprise") {
    opportunities.push("行业 Agent 落地提速");
  }

  if (primaryTheme === "open_source") {
    opportunities.push("开源生态与端侧部署受益");
  }

  if (primaryTheme === "world_model" || text.includes("视频")) {
    opportunities.push("世界模型与具身智能新场景");
  }

  if (eventType === "safety") {
    opportunities.push("安全评测和合规工具成长");
  }

  return uniqueItems(opportunities).slice(0, 4);
}

export function calculateImpactScore(item, primaryTheme, companies, eventType, reportDate) {
  const sourceScore = SOURCE_WEIGHTS[item.sourceType] ?? 12;
  const themeScore = THEME_WEIGHTS[primaryTheme] ?? 15;
  const recencyDays = daysBetween(reportDate, item.publishedAt);
  const recencyScore = recencyDays <= 7 ? 20 : recencyDays <= 30 ? 16 : recencyDays <= 60 ? 12 : 8;
  const entityScore = companies
    .slice(0, 2)
    .reduce((total, company) => total + (ENTITY_WEIGHTS[company] ?? 8), 0);
  const eventBonus =
    eventType === "funding" ? 10 : eventType === "infrastructure" ? 9 : eventType === "model_release" ? 8 : 6;
  const keywordBonus = item.content.includes("agent") || item.content.includes("Agent") ? 4 : 0;

  return clamp(sourceScore + themeScore + recencyScore + entityScore + eventBonus + keywordBonus, 42, 98);
}

export function buildStructuredSummary(item, metadata) {
  const themeLabel = THEME_LABELS[metadata.primaryTheme] ?? metadata.primaryTheme;
  const eventLabel = EVENT_TYPE_LABELS[metadata.eventType] ?? metadata.eventType;
  const companyLabel = metadata.companies.length ? metadata.companies.join("、") : item.sourceName;

  return `${companyLabel} 相关的 ${eventLabel} 事件，核心主题落在“${themeLabel}”。新闻重点是 ${item.summary.replace(/。$/, "")}，因此可归入 ${themeLabel} 的高关注样本。`;
}

export function buildImpactAnalysis(item, metadata) {
  const primaryCompany = metadata.companies[0] ?? item.sourceName;

  if (metadata.primaryTheme === "infrastructure") {
    return `${primaryCompany} 把竞争重心继续推向长期算力锁定，说明前沿模型厂商的护城河正在从参数和产品扩展到基础设施承诺。`;
  }

  if (metadata.primaryTheme === "capital") {
    return `${primaryCompany} 相关新闻显示资本市场仍愿意为头部 AI 平台支付高溢价，但同时也会把增长兑现和商业化节奏推到更高压力位。`;
  }

  if (metadata.primaryTheme === "enterprise") {
    return `${primaryCompany} 的动作说明行业客户不再只采购模型 API，而是希望采购一整套可治理、可交付的行业 Agent 解决方案。`;
  }

  if (metadata.primaryTheme === "safety") {
    return `${primaryCompany} 把安全研究和外部协作放到更显眼的位置，意味着安全不再只是附属叙事，而是影响产品扩张和政策信任的核心变量。`;
  }

  if (metadata.primaryTheme === "open_source") {
    return `${primaryCompany} 把竞争拉回到开源与部署效率层面，这会推动更多开发者和端侧场景重新评估闭源与开源模型的性价比。`;
  }

  if (metadata.primaryTheme === "world_model" || metadata.primaryTheme === "content_ai") {
    return `${primaryCompany} 所在赛道正在把视频生成、世界模型和具身能力绑定在一起，说明内容 AI 正向更强交互和物理世界建模延伸。`;
  }

  return `${primaryCompany} 释放出的信号是：AI 竞争正在从单点模型能力，转向模型、产品、资本和生态联动的系统竞赛。`;
}

export function buildInsightFromMetadata(item, reportDate, metadataInput, options = {}) {
  const searchableText = item.searchableText;
  const eventType = normalizeEventType(metadataInput.eventType);
  const primaryTheme = normalizeTheme(metadataInput.primaryTheme);
  const secondaryThemes = normalizeStringArray(metadataInput.secondaryThemes, 3)
    .map(normalizeTheme)
    .filter((theme) => theme !== primaryTheme)
    .slice(0, 3);
  const companies = normalizeStringArray(metadataInput.companies, 5);
  const keywords = normalizeStringArray(metadataInput.keywords, 5);
  const sentimentLabel = normalizeSentimentLabel(metadataInput.sentimentLabel);
  const sentimentScore = SENTIMENT_SCORE_BY_LABEL[sentimentLabel];
  const impactScore = calculateImpactScore(item, primaryTheme, companies, eventType, reportDate);
  const confidenceScore = clamp(metadataInput.confidenceScore ?? 0.82, 0.7, 0.95);
  const riskTags = normalizeStringArray(metadataInput.riskTags, 4);
  const opportunityTags = normalizeStringArray(metadataInput.opportunityTags, 4);
  const metadata = {
    eventType,
    primaryTheme,
    secondaryThemes,
    companies,
    keywords,
    sentimentLabel,
    sentimentScore,
    impactScore,
    confidenceScore,
    riskTags: riskTags.length ? riskTags : buildRiskTags(primaryTheme, eventType, searchableText),
    opportunityTags: opportunityTags.length
      ? opportunityTags
      : buildOpportunityTags(primaryTheme, eventType, searchableText)
  };

  return {
    id: `insight-${item.id}`,
    rawNewsId: item.id,
    title: item.title,
    sourceName: item.sourceName,
    sourceType: item.sourceType,
    sourceUrl: item.sourceUrl,
    publishedAt: item.publishedAt,
    language: item.language,
    region: item.region,
    eventType,
    primaryTheme,
    secondaryThemes,
    companies,
    keywords,
    sentimentLabel,
    sentimentScore,
    impactScore,
    confidenceScore,
    riskTags: metadata.riskTags,
    opportunityTags: metadata.opportunityTags,
    structuredSummary: normalizeTextValue(metadataInput.structuredSummary) || buildStructuredSummary(item, metadata),
    impactAnalysis: normalizeTextValue(metadataInput.impactAnalysis) || buildImpactAnalysis(item, metadata),
    clusterKey: `${primaryTheme}:${companies[0] ?? item.sourceName}`,
    reasoning: {
      sourceWeight: SOURCE_WEIGHTS[item.sourceType] ?? 12,
      themeLabel: THEME_LABELS[primaryTheme] ?? primaryTheme,
      matchedCompanies: companies,
      matchedKeywords: keywords,
      analysisMode: options.analysisMode ?? "rules"
    }
  };
}

export function extractInsight(item, reportDate) {
  const searchableText = item.searchableText;
  const companies = detectCompanies(searchableText);
  const { primaryTheme, secondaryThemes } = detectTheme(searchableText);
  const eventType = detectEventType(searchableText);
  const { sentimentLabel } = detectSentiment(searchableText, item.sourceType);
  const keywords = uniqueItems(
    [
      ...Object.values(COMPANY_KEYWORDS)
        .flat()
        .filter((keyword) => searchableText.includes(keyword)),
      ...Object.values(THEME_KEYWORDS)
        .flat()
        .filter((keyword) => searchableText.includes(keyword))
    ].map((keyword) => keyword.replace(/-/g, " "))
  ).slice(0, 5);

  return buildInsightFromMetadata(
    item,
    reportDate,
    {
      eventType,
      primaryTheme,
      secondaryThemes,
      companies,
      keywords,
      sentimentLabel,
      confidenceScore: (item.sourceType === "official" ? 0.88 : 0.78) + keywords.length * 0.01,
      riskTags: buildRiskTags(primaryTheme, eventType, searchableText),
      opportunityTags: buildOpportunityTags(primaryTheme, eventType, searchableText)
    },
    {
      analysisMode: "rules"
    }
  );
}
