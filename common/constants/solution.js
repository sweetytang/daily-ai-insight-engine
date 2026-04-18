export const DEFAULT_REPORT_SOLUTION = "a";

export const REPORT_SOLUTION_LABELS = {
  a: "方案 A · 规则版",
  b: "方案 B · LLM 版"
};

const solutionAliases = {
  a: "a",
  b: "b",
  rule: "a",
  rules: "a",
  llm: "b"
};

export function normalizeReportSolution(input) {
  if (typeof input !== "string") {
    return DEFAULT_REPORT_SOLUTION;
  }

  return solutionAliases[input.trim().toLowerCase()] ?? DEFAULT_REPORT_SOLUTION;
}

export function isLlmSolution(input) {
  return normalizeReportSolution(input) === "b";
}

export function getReportSolutionLabel(input) {
  const solution = normalizeReportSolution(input);
  return REPORT_SOLUTION_LABELS[solution];
}
