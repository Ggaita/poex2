import { Router } from "express";
import { authenticateRequest, requireRole } from "../../../middlewares/auth.middleware";
import {
  deleteAdminProfileProductHandler,
  getAdminProfileAuditTrail,
  getAdminProfileDetail,
  getAdminProfiles,
  patchAdminProfileProduct,
  patchAdminProfileProductReview,
  patchAdminProfileData,
  patchAdminProfileSettings,
  patchAdminProfileVisibility,
  postAdminProfileProduct
} from "../controllers/admin-profiles.controller";

const router = Router();

router.use(authenticateRequest, requireRole("admin"));

router.get("/", getAdminProfiles);
router.get("/:id", getAdminProfileDetail);
router.get("/:id/audit", getAdminProfileAuditTrail);
router.patch("/:id/data", patchAdminProfileData);
router.patch("/:id/settings", patchAdminProfileSettings);
router.patch("/:id/visibility", patchAdminProfileVisibility);
router.post("/:id/products", postAdminProfileProduct);
router.patch("/:id/products/:productId", patchAdminProfileProduct);
router.patch("/:id/products/:productId/review", patchAdminProfileProductReview);
router.delete("/:id/products/:productId", deleteAdminProfileProductHandler);

export default router;
