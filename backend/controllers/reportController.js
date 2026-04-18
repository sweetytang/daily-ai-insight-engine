import { normalizeReportSolution } from "../../common/constants/solution.js";
import { getLatestReportPayload, refreshLatestReportPayload } from "../services/reportService.js";

function getRequestSolution(request) {
  return normalizeReportSolution(request.query.solution ?? request.body?.solution);
}

export async function getHealth(request, response) {
  return response.json({
    message: "ok"
  });
}

export async function getLatestReport(request, response) {
  const reportPayload = await getLatestReportPayload(undefined, getRequestSolution(request));
  return response.json(reportPayload);
}

export async function refreshLatestReport(request, response) {
  const { payload } = await refreshLatestReportPayload(undefined, getRequestSolution(request));
  return response.json(payload);
}
