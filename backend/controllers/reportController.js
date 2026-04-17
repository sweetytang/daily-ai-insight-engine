import { getLatestReportPayload } from "../services/reportService.js";

export async function getHealth(request, response) {
  return response.json({
    message: "ok"
  });
}

export async function getLatestReport(request, response) {
  const reportPayload = await getLatestReportPayload();
  return response.json(reportPayload);
}
