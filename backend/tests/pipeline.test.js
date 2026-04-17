import test from "node:test";
import assert from "node:assert/strict";

import { DEFAULT_REPORT_DATE } from "../../common/constants/analysis.js";
import { analysisGraph } from "../models/analysisGraph.js";
import { loadSeedNews } from "../services/datasetService.js";

test("analysis graph should produce complete report payload", async () => {
  const rawItems = loadSeedNews();
  const state = await analysisGraph.invoke({
    reportDate: DEFAULT_REPORT_DATE,
    rawItems
  });

  assert.equal(state.report.summary.totalNews, rawItems.length);
  assert.equal(state.report.hotTopics.length, 5);
  assert.ok(state.report.trendSignals.length >= 3);
  assert.ok(state.report.structuredInsights.every((item) => item.impactScore >= 42));
});
