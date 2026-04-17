import type { DailyReportPayload } from "@/types/dashboard";

export async function fetchLatestReport() {
  const response = await fetch("/api/report/latest");

  if (!response.ok) {
    throw new Error("日报数据加载失败");
  }

  return (await response.json()) as DailyReportPayload;
}
