import { create } from "zustand";

import { fetchLatestReport, refreshLatestReport } from "@/services/api";

import type { DailyReportPayload, ReportSolution } from "@/types/dashboard";

interface DashboardState {
  data: DailyReportPayload | null;
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  refreshError: string | null;
  activeTheme: string;
  setActiveTheme: (theme: string) => void;
  loadReport: (solution: ReportSolution) => Promise<void>;
  refreshReport: (solution: ReportSolution) => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  data: null,
  loading: false,
  error: null,
  refreshing: false,
  refreshError: null,
  activeTheme: "all",
  setActiveTheme: (theme) => set({ activeTheme: theme }),
  loadReport: async (solution) => {
    set({ loading: true, error: null, refreshError: null });

    try {
      const data = await fetchLatestReport(solution);
      set({ data, loading: false });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "日报数据加载失败"
      });
    }
  },
  refreshReport: async (solution) => {
    set({ refreshing: true, refreshError: null });

    try {
      const data = await refreshLatestReport(solution);
      set({
        data,
        refreshing: false,
        refreshError: null,
        error: null
      });
    } catch (error) {
      set({
        refreshing: false,
        refreshError: error instanceof Error ? error.message : "实时舆情生成失败"
      });
    }
  }
}));
