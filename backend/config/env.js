import process from "node:process";

import { DEFAULT_REPORT_DATE } from "../../common/constants/analysis.js";

process.loadEnvFile?.();

export const env = {
  port: Number(process.env.PORT || 3001),
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  reportDate: process.env.REPORT_DATE || DEFAULT_REPORT_DATE
};
