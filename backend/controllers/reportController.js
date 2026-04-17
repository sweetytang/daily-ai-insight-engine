import { getLatestReportPayload, refreshLatestReportPayload } from "../services/reportService.js";

export async function getHealth(request, response) {
  return response.json({
    message: "ok"
  });
}

export async function getLatestReport(request, response) {
  const reportPayload = await getLatestReportPayload();
  return response.json(reportPayload);
}

export async function refreshLatestReport(request, response) {
  const { payload } = await refreshLatestReportPayload();
  return response.json(payload);
}
