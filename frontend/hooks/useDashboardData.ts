import { useEffect } from "react";

import { useDashboardStore } from "@/store/dashboardStore";

import type { ReportSolution } from "@/types/dashboard";

export function useDashboardData(solution: ReportSolution) {
  const data = useDashboardStore((state) => state.data);
  const loading = useDashboardStore((state) => state.loading);
  const error = useDashboardStore((state) => state.error);
  const loadReport = useDashboardStore((state) => state.loadReport);

  useEffect(() => {
    if ((!data || data.solution !== solution) && !loading) {
      void loadReport(solution);
    }
  }, [data, loading, loadReport, solution]);

  return {
    data,
    loading,
    error
  };
}
