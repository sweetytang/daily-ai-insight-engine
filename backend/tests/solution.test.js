import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_REPORT_SOLUTION,
  getReportSolutionLabel,
  isLlmSolution,
  normalizeReportSolution
} from "../../common/constants/solution.js";

test("solution helpers should normalize aliases and labels", () => {
  assert.equal(normalizeReportSolution(undefined), DEFAULT_REPORT_SOLUTION);
  assert.equal(normalizeReportSolution("rule"), "a");
  assert.equal(normalizeReportSolution("llm"), "b");
  assert.equal(isLlmSolution("b"), true);
  assert.equal(isLlmSolution("a"), false);
  assert.equal(getReportSolutionLabel("b"), "方案 B · LLM 版");
});
