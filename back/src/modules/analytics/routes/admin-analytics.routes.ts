import { Router } from "express";
import { authenticateRequest, requireRole } from "../../../middlewares/auth.middleware";
import {
  getAdminAnalyticsExportCsv,
  getAdminAnalyticsSummary
} from "../controllers/admin-analytics.controller";

const router = Router();
router.use(authenticateRequest, requireRole("admin"));
router.get("/summary", getAdminAnalyticsSummary);
router.get("/export.csv", getAdminAnalyticsExportCsv);
export default router;
