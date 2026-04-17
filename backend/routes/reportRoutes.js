import { Router } from "express";

import { getHealth, getLatestReport } from "../controllers/reportController.js";

const router = Router();

router.get("/health", getHealth);
router.get("/report/latest", getLatestReport);

export { router as reportRoutes };
