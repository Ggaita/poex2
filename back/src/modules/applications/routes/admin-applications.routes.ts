import { Router } from "express";
import {
  getAdminApplicationById,
  getAdminApplications,
  getAdminApplicationsPendingCount,
  updateAdminApplicationStatus
} from "../controllers/admin-applications.controller";
import { authenticateRequest, requireRole } from "../../../middlewares/auth.middleware";

const router = Router();
router.use(authenticateRequest, requireRole("admin"));

router.get("/", getAdminApplications);
router.get("/pending-count", getAdminApplicationsPendingCount);
router.get("/:id", getAdminApplicationById);
router.patch("/:id/status", updateAdminApplicationStatus);

export default router;
