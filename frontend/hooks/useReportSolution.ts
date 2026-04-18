import { useMemo } from "react";

import {
  DEFAULT_REPORT_SOLUTION,
  getReportSolutionLabel,
  normalizeReportSolution
} from "@common/constants/solution";

import type { ReportSolution } from "@/types/dashboard";

export function useReportSolution() {
  const solution = useMemo(() => {
    if (typeof window === "undefined") {
      return DEFAULT_REPORT_SOLUTION as ReportSolution;
    }

    const searchParams = new URLSearchParams(window.location.search);
    return normalizeReportSolution(searchParams.get("solution")) as ReportSolution;
  }, []);

  return {
    solution,
    solutionLabel: getReportSolutionLabel(solution),
    solutionOptions: [
      {
        key: "a" as ReportSolution,
        label: getReportSolutionLabel("a"),
        href: "?solution=a"
      },
      {
        key: "b" as ReportSolution,
        label: getReportSolutionLabel("b"),
        href: "?solution=b"
      }
    ]
  };
}
