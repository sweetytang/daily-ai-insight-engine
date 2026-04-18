import type { DailyReportPayload } from "@/types/dashboard";
import type { ReportSolution } from "@/types/dashboard";

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

function createReportUrl(pathname: string, solution: ReportSolution) {
  const searchParams = new URLSearchParams({
    solution
  });

  return `${pathname}?${searchParams.toString()}`;
}

export async function fetchLatestReport(solution: ReportSolution) {
  const response = await fetch(createReportUrl("/api/report/latest", solution));

  if (!response.ok) {
    throw new Error(await buildRequestError(response, "日报数据加载失败"));
  }

  return (await response.json()) as DailyReportPayload;
}

export async function refreshLatestReport(solution: ReportSolution) {
  const response = await fetch(createReportUrl("/api/report/refresh", solution), {
    method: "POST"
  });

  if (!response.ok) {
    throw new Error(await buildRequestError(response, "实时舆情生成失败"));
  }

  return (await response.json()) as DailyReportPayload;
}
