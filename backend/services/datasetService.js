import fs from "node:fs";
import path from "node:path";

const rawNewsPath = path.resolve(process.cwd(), "backend/services/data/raw-news.json");
const generatedReportPath = path.resolve(process.cwd(), "backend/services/data/generated-report.json");

export function loadSeedNews() {
  const rawContent = fs.readFileSync(rawNewsPath, "utf-8");
  return JSON.parse(rawContent);
}

export function writeGeneratedReport(reportPayload) {
  fs.writeFileSync(generatedReportPath, JSON.stringify(reportPayload, null, 2));
  return generatedReportPath;
}
