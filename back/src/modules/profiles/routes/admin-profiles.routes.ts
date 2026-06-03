import { Router } from "express";
import { authenticateRequest, requireRole } from "../../../middlewares/auth.middleware";
import {
  getAdminProfileAuditTrail,
  getAdminProfileDetail,
  getAdminProfiles,
  patchAdminProfileData,
  patchAdminProfileSettings,
  patchAdminProfileVisibility
} from "../controllers/admin-profiles.controller";

const router = Router();

router.use(authenticateRequest, requireRole("admin"));

router.get("/", getAdminProfiles);
router.get("/:id", getAdminProfileDetail);
router.get("/:id/audit", getAdminProfileAuditTrail);
router.patch("/:id/data", patchAdminProfileData);
router.patch("/:id/settings", patchAdminProfileSettings);
router.patch("/:id/visibility", patchAdminProfileVisibility);

export default router;
