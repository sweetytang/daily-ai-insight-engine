import test from "node:test";
import assert from "node:assert/strict";

import { DEFAULT_REPORT_DATE } from "../../common/constants/analysis.js";
import { loadSeedNews } from "../services/datasetService.js";
import { buildInsightFromMetadata, extractInsight, normalizeRawNews } from "../utils/analysis.js";
import { buildDailyReportPayload } from "../utils/reportBuilder.js";

test("report builder should expose solution metadata for A and B", () => {
  const structuredItems = loadSeedNews()
    .slice(0, 3)
    .map(normalizeRawNews)
    .map((item) => extractInsight(item, DEFAULT_REPORT_DATE));
  const rulePayload = buildDailyReportPayload({
    reportDate: DEFAULT_REPORT_DATE,
    structuredItems,
    solution: "a"
  });
  const llmPayload = buildDailyReportPayload({
    reportDate: DEFAULT_REPORT_DATE,
    structuredItems,
    solution: "b",
    promptExecutionMode: "runtime"
  });

  assert.equal(rulePayload.solution, "a");
  assert.equal(rulePayload.promptCatalog.executionMode, "design_only");
  assert.equal(llmPayload.solution, "b");
  assert.equal(llmPayload.promptCatalog.executionMode, "runtime");
  assert.match(llmPayload.methodology.keyStepReasons.at(-1), /方案 B/);
});

test("llm metadata should be normalized into a stable insight shape", () => {
  const item = normalizeRawNews(loadSeedNews()[0]);
  const insight = buildInsightFromMetadata(
    item,
    DEFAULT_REPORT_DATE,
    {
      eventType: "unknown",
      primaryTheme: "invalid",
      secondaryThemes: ["multimodal", "invalid"],
      companies: ["OpenAI", "OpenAI"],
      keywords: ["gpt-5.4", "gpt-5.4"],
      sentimentLabel: "weird",
      structuredSummary: "这是结构化摘要。",
      impactAnalysis: "这是影响分析。",
      riskTags: ["执行压力"],
      opportunityTags: ["应用创新"],
      confidenceScore: 0.99
    },
    {
      analysisMode: "llm"
    }
  );

  assert.equal(insight.eventType, "ecosystem");
  assert.equal(insight.primaryTheme, "model");
  assert.deepEqual(insight.secondaryThemes, ["multimodal"]);
  assert.equal(insight.sentimentLabel, "neutral");
  assert.equal(insight.structuredSummary, "这是结构化摘要。");
  assert.equal(insight.impactAnalysis, "这是影响分析。");
  assert.equal(insight.reasoning.analysisMode, "llm");
});
