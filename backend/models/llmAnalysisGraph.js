import { Annotation, END, START, StateGraph } from "@langchain/langgraph";

import { buildDailyReportPayloadWithLlm } from "../services/llm/reportComposer.js";
import { extractInsightsWithLlm } from "../services/llm/extractionService.js";
import { normalizeRawNews } from "../utils/analysis.js";

const LlmAnalysisState = Annotation.Root({
  reportDate: Annotation(),
  rawItems: Annotation(),
  ingestion: Annotation(),
  normalizedItems: Annotation(),
  structuredItems: Annotation(),
  report: Annotation()
});

const llmAnalysisGraph = new StateGraph(LlmAnalysisState)
  .addNode("normalizeRawItems", (state) => ({
    normalizedItems: state.rawItems.map(normalizeRawNews)
  }))
  .addNode("extractStructuredInsights", async (state) => ({
    structuredItems: await extractInsightsWithLlm(state.normalizedItems, state.reportDate)
  }))
  .addNode("composeDailyReport", async (state) => ({
    report: await buildDailyReportPayloadWithLlm({
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

export { llmAnalysisGraph };
