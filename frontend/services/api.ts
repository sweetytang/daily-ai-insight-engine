import type { DailyReportPayload } from "@/types/dashboard";

async function buildRequestError(response: Response, fallbackMessage: string) {
  try {
    const payload = (await response.json()) as {
      message?: string;
      detail?: string;
    };

    return payload.detail || payload.message || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

export async function fetchLatestReport() {
  const response = await fetch("/api/report/latest");

  if (!response.ok) {
    throw new Error(await buildRequestError(response, "日报数据加载失败"));
  }

  return (await response.json()) as DailyReportPayload;
}

export async function refreshLatestReport() {
  const response = await fetch("/api/report/refresh", {
    method: "POST"
  });

  if (!response.ok) {
    throw new Error(await buildRequestError(response, "实时舆情生成失败"));
  }

  return (await response.json()) as DailyReportPayload;
}
