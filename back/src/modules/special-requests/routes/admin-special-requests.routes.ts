import { Router } from "express";
import { authenticateRequest, requireRole } from "../../../middlewares/auth.middleware";
import {
  getAdminSpecialRequestById,
  getAdminSpecialRequests,
  getAdminSpecialRequestsPendingCount,
  patchAdminSpecialRequest,
  postAdminSpecialRequestReplyEmail
} from "../controllers/admin-special-requests.controller";

const router = Router();

router.use(authenticateRequest, requireRole("admin"));

router.get("/", getAdminSpecialRequests);
router.get("/pending-count", getAdminSpecialRequestsPendingCount);
router.get("/:id", getAdminSpecialRequestById);
router.patch("/:id", patchAdminSpecialRequest);
router.post("/:id/reply-email", postAdminSpecialRequestReplyEmail);

export default router;
