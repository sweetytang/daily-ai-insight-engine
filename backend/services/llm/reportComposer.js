import { reportPrompt } from "../../models/promptTemplates.js";
import { buildDailyReportPayload } from "../../utils/reportBuilder.js";
import { createStructuredJsonResponse } from "./openaiClient.js";
import { reportNarrativeSchema } from "./schemas.js";

function buildReportPrompt({ reportDate, baselinePayload, structuredItems }) {
  const topItems = structuredItems.slice(0, 5).map((item) => ({
    id: item.id,
    title: item.title,
    sourceName: item.sourceName,
    primaryTheme: item.primaryTheme,
    eventType: item.eventType,
    impactScore: item.impactScore,
    sentimentLabel: item.sentimentLabel,
    structuredSummary: item.structuredSummary,
    impactAnalysis: item.impactAnalysis,
    riskTags: item.riskTags,
    opportunityTags: item.opportunityTags
  }));

  return [
    `报告日期：${reportDate}`,
    "请基于下面的聚合结果生成日报 JSON，不要改动事实口径。",
    JSON.stringify(
      {
        summary: baselinePayload.summary,
        ingestion: baselinePayload.ingestion,
        charts: baselinePayload.charts,
        hotTopics: baselinePayload.hotTopics.map((item) => ({
          id: item.id,
          title: item.title,
          impactScore: item.impactScore,
          sourceName: item.sourceName,
          primaryTheme: item.primaryTheme,
          sentimentLabel: item.sentimentLabel
        })),
        structuredItems: topItems
      },
      null,
      2
    )
  ].join("\n");
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

function normalizeTextValue(value) {
  return collectTextFragments(value).join("；");
}

function normalizeNarrativeGroup(items, mapper) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map(mapper)
    .filter(Boolean);
}

function normalizeNarrative(narrative) {
  return {
    overview: normalizeTextValue(narrative?.overview),
    hotTopics: normalizeNarrativeGroup(narrative?.hotTopics, (item) => {
      const id = normalizeTextValue(item?.id);
      const reason = normalizeTextValue(item?.reason ?? item?.detail ?? item?.summary ?? item);

      if (!id || !reason) {
        return null;
      }

      return { id, reason };
    }),
    deepDives: normalizeNarrativeGroup(narrative?.deepDives, (item) => {
      const title = normalizeTextValue(item?.title);
      const background = normalizeTextValue(item?.background ?? item?.summary);
      const impact = normalizeTextValue(item?.impact ?? item?.detail);
      const recommendation = normalizeTextValue(item?.recommendation ?? item?.action);

      if (!title || !background || !impact || !recommendation) {
        return null;
      }

      return {
        title,
        background,
        impact,
        recommendation
      };
    }),
    trendSignals: normalizeNarrativeGroup(narrative?.trendSignals, (item) => {
      const title = normalizeTextValue(item?.title);
      const detail = normalizeTextValue(item?.detail ?? item?.summary);
      const level = ["high", "medium", "low"].includes(item?.level) ? item.level : "medium";

      if (!title || !detail) {
        return null;
      }

      return { title, detail, level };
    }),
    riskAlerts: normalizeNarrativeGroup(narrative?.riskAlerts, (item) => {
      const title = normalizeTextValue(item?.title);
      const detail = normalizeTextValue(item?.detail ?? item?.summary);
      const level = ["high", "medium", "low"].includes(item?.level) ? item.level : "medium";

      if (!title || !detail) {
        return null;
      }

      return { title, detail, level };
    }),
    opportunityAlerts: normalizeNarrativeGroup(narrative?.opportunityAlerts, (item) => {
      const title = normalizeTextValue(item?.title);
      const detail = normalizeTextValue(item?.detail ?? item?.summary);
      const level = ["high", "medium", "low"].includes(item?.level) ? item.level : "medium";

      if (!title || !detail) {
        return null;
      }

      return { title, detail, level };
    })
  };
}

function mergeHotTopics(baseHotTopics, overrideHotTopics) {
  const reasonMap = new Map(overrideHotTopics.map((item) => [item.id, item.reason]));

  return baseHotTopics.map((item) => ({
    ...item,
    reason: reasonMap.get(item.id) ?? item.reason
  }));
}

function mergeDeepDives(baseDeepDives, overrideDeepDives) {
  if (!overrideDeepDives.length) {
    return baseDeepDives;
  }

  return baseDeepDives.map((item, index) => ({
    ...item,
    ...overrideDeepDives[index]
  }));
}

function mergeAlertGroup(baseItems, overrideItems) {
  return overrideItems.length ? overrideItems : baseItems;
}

export async function buildDailyReportPayloadWithLlm({ reportDate, structuredItems, ingestion }) {
  const baselinePayload = buildDailyReportPayload({
    reportDate,
    structuredItems,
    ingestion,
    solution: "b",
    promptExecutionMode: "runtime"
  });
  const narrative = normalizeNarrative(await createStructuredJsonResponse({
    schemaName: "daily_report_narrative",
    schema: reportNarrativeSchema,
    systemPrompt: reportPrompt,
    userPrompt: buildReportPrompt({
      reportDate,
      baselinePayload,
      structuredItems
    }),
    maxOutputTokens: 2200
  }));

  return {
    ...baselinePayload,
    overview: narrative.overview || baselinePayload.overview,
    hotTopics: mergeHotTopics(baselinePayload.hotTopics, narrative.hotTopics),
    deepDives: mergeDeepDives(baselinePayload.deepDives, narrative.deepDives),
    trendSignals: mergeAlertGroup(baselinePayload.trendSignals, narrative.trendSignals),
    riskAlerts: mergeAlertGroup(baselinePayload.riskAlerts, narrative.riskAlerts),
    opportunityAlerts: mergeAlertGroup(baselinePayload.opportunityAlerts, narrative.opportunityAlerts)
  };
}
