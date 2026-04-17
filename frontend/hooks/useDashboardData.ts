import { useEffect } from "react";

import { useDashboardStore } from "@/store/dashboardStore";

export function useDashboardData() {
  const data = useDashboardStore((state) => state.data);
  const loading = useDashboardStore((state) => state.loading);
  const error = useDashboardStore((state) => state.error);
  const loadReport = useDashboardStore((state) => state.loadReport);

  useEffect(() => {
    if (!data && !loading) {
      void loadReport();
    }
  }, [data, loading, loadReport]);

  return {
    data,
    loading,
    error
  };
}
