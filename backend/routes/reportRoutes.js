import { Router } from "express";

import { getHealth, getLatestReport, refreshLatestReport } from "../controllers/reportController.js";

const router = Router();

router.get("/health", getHealth);
router.get("/report/latest", getLatestReport);
router.post("/report/refresh", refreshLatestReport);

export { router as reportRoutes };
