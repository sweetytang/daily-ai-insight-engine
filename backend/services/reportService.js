import { prisma } from "../config/database.js";
import { DEFAULT_REPORT_DATE } from "../../common/constants/analysis.js";
import { analysisGraph } from "../models/analysisGraph.js";
import { loadSeedNews, writeGeneratedReport } from "./datasetService.js";
import { buildSeedIngestion, fetchLiveNewsItems } from "./fetchers/index.js";

function createSeedSourceSnapshot() {
  const rawItems = loadSeedNews();

  return {
    rawItems,
    ingestion: buildSeedIngestion(rawItems)
  };
}

function createFallbackIngestion(summary, generatedAt) {
  return {
    mode: "seed",
    sources: ["本地样例数据"],
    failedSources: [],
    fetchedCount: summary?.totalNews ?? 0,
    refreshedAt: generatedAt
  };
}

function serializeMethodology(methodology) {
  if (!methodology) {
    return null;
  }

  const { ingestion, ...rest } = methodology;
  return rest;
}

function normalizePayloadForResponse(payload) {
  return {
    ...payload,
    methodology: serializeMethodology(payload.methodology)
  };
}

function serializeReportRecord(record) {
  const generatedAt = record.updatedAt.toISOString();
  const ingestion = record.methodology?.ingestion ?? createFallbackIngestion(record.summary, generatedAt);

  return {
    reportDate: record.reportDate,
    generatedAt,
    title: record.title,
    overview: record.overview,
    summary: record.summary,
    ingestion,
    hotTopics: record.hotTopics,
    deepDives: record.deepDives,
    trendSignals: record.trendSignals,
    riskAlerts: record.riskAlerts,
    opportunityAlerts: record.opportunityAlerts,
    charts: record.chartPayload,
    methodology: serializeMethodology(record.methodology),
    promptCatalog: record.promptCatalog
  };
}

function mergePayload(reportRecord, insights) {
  return {
    ...serializeReportRecord(reportRecord),
    structuredInsights: insights.map(({ rawNews, ...insight }) => ({
      ...insight,
      title: rawNews.title,
      sourceName: rawNews.sourceName,
      sourceType: rawNews.sourceType,
      sourceUrl: rawNews.sourceUrl,
      publishedAt: rawNews.publishedAt.toISOString(),
      language: rawNews.language,
      region: rawNews.region
    }))
  };
}

async function buildReportPayload(reportDate, sourceSnapshot) {
  const state = await analysisGraph.invoke({
    reportDate,
    rawItems: sourceSnapshot.rawItems,
    ingestion: sourceSnapshot.ingestion
  });

  return state.report;
}

export async function generateReportPayload(reportDate = DEFAULT_REPORT_DATE) {
  return buildReportPayload(reportDate, createSeedSourceSnapshot());
}

export async function persistReportPayload(reportDate = DEFAULT_REPORT_DATE, sourceSnapshot = createSeedSourceSnapshot()) {
  const payload = await buildReportPayload(reportDate, sourceSnapshot);
  const rawItems = sourceSnapshot.rawItems;

  await prisma.$transaction(async (transaction) => {
    await transaction.structuredInsight.deleteMany();
    await transaction.rawNews.deleteMany();

    for (const item of rawItems) {
      await transaction.rawNews.create({
        data: {
          id: item.id,
          title: item.title,
          summary: item.summary,
          content: item.content,
          sourceName: item.sourceName,
          sourceType: item.sourceType,
          sourceUrl: item.sourceUrl,
          publishedAt: new Date(item.publishedAt),
          language: item.language,
          region: item.region
        }
      });
    }

    for (const item of payload.structuredInsights) {
      await transaction.structuredInsight.create({
        data: {
          id: item.id,
          rawNewsId: item.rawNewsId,
          eventType: item.eventType,
          primaryTheme: item.primaryTheme,
          secondaryThemes: item.secondaryThemes,
          companies: item.companies,
          keywords: item.keywords,
          sentimentLabel: item.sentimentLabel,
          sentimentScore: item.sentimentScore,
          impactScore: item.impactScore,
          confidenceScore: item.confidenceScore,
          riskTags: item.riskTags,
          opportunityTags: item.opportunityTags,
          structuredSummary: item.structuredSummary,
          impactAnalysis: item.impactAnalysis,
          clusterKey: item.clusterKey,
          reasoning: item.reasoning
        }
      });
    }

    await transaction.dailyReport.upsert({
      where: { reportDate: payload.reportDate },
      update: {
        title: payload.title,
        overview: payload.overview,
        summary: payload.summary,
        hotTopics: payload.hotTopics,
        deepDives: payload.deepDives,
        trendSignals: payload.trendSignals,
        riskAlerts: payload.riskAlerts,
        opportunityAlerts: payload.opportunityAlerts,
        chartPayload: payload.charts,
        methodology: payload.methodology,
        promptCatalog: payload.promptCatalog
      },
      create: {
        id: `report-${payload.reportDate}`,
        reportDate: payload.reportDate,
        title: payload.title,
        overview: payload.overview,
        summary: payload.summary,
        hotTopics: payload.hotTopics,
        deepDives: payload.deepDives,
        trendSignals: payload.trendSignals,
        riskAlerts: payload.riskAlerts,
        opportunityAlerts: payload.opportunityAlerts,
        chartPayload: payload.charts,
        methodology: payload.methodology,
        promptCatalog: payload.promptCatalog
      }
    });
  });

  const outputPath = writeGeneratedReport(payload);

  return {
    payload: normalizePayloadForResponse(payload),
    outputPath
  };
}

export async function refreshLatestReportPayload(reportDate = DEFAULT_REPORT_DATE) {
  const sourceSnapshot = await fetchLiveNewsItems();
  return persistReportPayload(reportDate, sourceSnapshot);
}

export async function getLatestReportPayload(reportDate = DEFAULT_REPORT_DATE) {
  const reportRecord = await prisma.dailyReport.findUnique({
    where: { reportDate }
  });

  if (!reportRecord) {
    const { payload } = await persistReportPayload(reportDate);
    return payload;
  }

  const insights = await prisma.structuredInsight.findMany({
    include: {
      rawNews: true
    },
    orderBy: {
      impactScore: "desc"
    }
  });

  return mergePayload(reportRecord, insights);
}
