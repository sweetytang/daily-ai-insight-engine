import { Annotation, END, START, StateGraph } from "@langchain/langgraph";

import { buildDailyReportPayload } from "../utils/reportBuilder.js";
import { extractInsight, normalizeRawNews } from "../utils/analysis.js";

const AnalysisState = Annotation.Root({
  reportDate: Annotation(),
  rawItems: Annotation(),
  ingestion: Annotation(),
  normalizedItems: Annotation(),
  structuredItems: Annotation(),
  report: Annotation()
});

const analysisGraph = new StateGraph(AnalysisState)
  .addNode("normalizeRawItems", (state) => ({
    normalizedItems: state.rawItems.map(normalizeRawNews)
  }))
  .addNode("extractStructuredInsights", (state) => ({
    structuredItems: state.normalizedItems.map((item) => extractInsight(item, state.reportDate))
  }))
  .addNode("composeDailyReport", (state) => ({
    report: buildDailyReportPayload({
      reportDate: state.reportDate,
      structuredItems: state.structuredItems,
      ingestion: state.ingestion
    })
  }))
  .addEdge(START, "normalizeRawItems")
  .addEdge("normalizeRawItems", "extractStructuredInsights")
  .addEdge("extractStructuredInsights", "composeDailyReport")
  .addEdge("composeDailyReport", END)
  .compile();

export { analysisGraph };
