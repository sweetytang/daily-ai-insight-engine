import { prisma } from "../config/database.js";

const statements = [
  `
  CREATE TABLE IF NOT EXISTS "RawNews" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "publishedAt" NUMERIC NOT NULL,
    "language" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "collectedAt" NUMERIC NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS "StructuredInsight" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rawNewsId" TEXT NOT NULL UNIQUE,
    "eventType" TEXT NOT NULL,
    "primaryTheme" TEXT NOT NULL,
    "secondaryThemes" JSONB NOT NULL,
    "companies" JSONB NOT NULL,
    "keywords" JSONB NOT NULL,
    "sentimentLabel" TEXT NOT NULL,
    "sentimentScore" REAL NOT NULL,
    "impactScore" INTEGER NOT NULL,
    "confidenceScore" REAL NOT NULL,
    "riskTags" JSONB NOT NULL,
    "opportunityTags" JSONB NOT NULL,
    "structuredSummary" TEXT NOT NULL,
    "impactAnalysis" TEXT NOT NULL,
    "clusterKey" TEXT NOT NULL,
    "reasoning" JSONB NOT NULL,
    CONSTRAINT "StructuredInsight_rawNewsId_fkey" FOREIGN KEY ("rawNewsId") REFERENCES "RawNews" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS "DailyReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportDate" TEXT NOT NULL UNIQUE,
    "title" TEXT NOT NULL,
    "overview" TEXT NOT NULL,
    "summary" JSONB NOT NULL,
    "hotTopics" JSONB NOT NULL,
    "deepDives" JSONB NOT NULL,
    "trendSignals" JSONB NOT NULL,
    "riskAlerts" JSONB NOT NULL,
    "opportunityAlerts" JSONB NOT NULL,
    "chartPayload" JSONB NOT NULL,
    "methodology" JSONB NOT NULL,
    "promptCatalog" JSONB NOT NULL,
    "createdAt" NUMERIC NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" NUMERIC NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  `
];

for (const statement of statements) {
  await prisma.$executeRawUnsafe(statement);
}

console.log("[db:init] SQLite 数据表已初始化");

await prisma.$disconnect();
