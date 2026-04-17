import { create } from "zustand";

import { fetchLatestReport } from "@/services/api";

import type { DailyReportPayload } from "@/types/dashboard";

interface DashboardState {
  data: DailyReportPayload | null;
  loading: boolean;
  error: string | null;
  activeTheme: string;
  setActiveTheme: (theme: string) => void;
  loadReport: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  data: null,
  loading: false,
  error: null,
  activeTheme: "all",
  setActiveTheme: (theme) => set({ activeTheme: theme }),
  loadReport: async () => {
    set({ loading: true, error: null });

    try {
      const data = await fetchLatestReport();
      set({ data, loading: false });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "日报数据加载失败"
      });
    }
  }
}));
