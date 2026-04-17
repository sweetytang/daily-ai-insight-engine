import { persistReportPayload } from "../services/reportService.js";

const { payload, outputPath } = await persistReportPayload();

console.log(`[seed] 已生成 ${payload.reportDate} 的日报样例`);
console.log(`[seed] 输出文件: ${outputPath}`);
