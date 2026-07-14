import { Router } from "express";
import { authenticateRequest, requireRole } from "../../../middlewares/auth.middleware";
import {
  getAdminSpecialRequestById,
  getAdminSpecialRequests,
  patchAdminSpecialRequest
} from "../controllers/admin-special-requests.controller";

const router = Router();

router.use(authenticateRequest, requireRole("admin"));

router.get("/", getAdminSpecialRequests);
router.get("/:id", getAdminSpecialRequestById);
router.patch("/:id", patchAdminSpecialRequest);

export default router;
